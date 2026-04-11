<?php

declare(strict_types=1);

namespace BloodLink;

use DateInterval;
use DateTimeImmutable;
use PDO;
use PDOException;

final class AuthService
{
    public function __construct(private readonly PDO $db)
    {
    }

    public function bootstrap(): array
    {
        $this->ensureSession();
        $csrfToken = $this->csrfToken();

        $userId = $_SESSION['user_id'] ?? null;
        if (!$userId) {
            return [
                'authenticated' => false,
                'csrf_token' => $csrfToken,
            ];
        }

        $user = $this->loadCurrentUser((int) $userId);
        if (!$user) {
            $this->logout();
            return [
                'authenticated' => false,
                'csrf_token' => $csrfToken,
            ];
        }

        return [
            'authenticated' => true,
            'csrf_token' => $csrfToken,
            'user' => $user,
        ];
    }

    public function csrfToken(): string
    {
        $this->ensureSession();

        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }

        return (string) $_SESSION['csrf_token'];
    }

    public function validateCsrf(?string $token): void
    {
        $this->ensureSession();
        if ($token === null || $token === '' || !hash_equals((string) ($_SESSION['csrf_token'] ?? ''), $token)) {
            throw new AuthException('Invalid CSRF token', 419);
        }
    }

    public function requireAuth(): array
    {
        $user = $this->currentUser();
        if (!$user) {
            throw new AuthException('Authentication required', 401);
        }

        return $user;
    }

    public function requireRole(string $role): array
    {
        $user = $this->requireAuth();
        if (($user['role'] ?? 'user') !== $role) {
            throw new AuthException('Forbidden', 403);
        }

        return $user;
    }

    public function currentUser(): ?array
    {
        $this->ensureSession();

        $userId = (int) ($_SESSION['user_id'] ?? 0);
        if ($userId <= 0) {
            return null;
        }

        return $this->loadCurrentUser($userId);
    }

    public function login(array $input): array
    {
        $this->ensureSession();
        $email = $this->normalizeEmail((string) ($input['email'] ?? ''));
        $password = (string) ($input['password'] ?? '');
        $twoFactorCode = trim((string) ($input['two_factor_code'] ?? ''));

        if ($email === '' || $password === '') {
            throw new AuthException('Email and password are required', 422);
        }

        $stmt = $this->db->prepare('SELECT * FROM users WHERE email = :email AND deleted_at IS NULL LIMIT 1');
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch();

        if (!$row || empty($row['password_hash']) || !password_verify($password, (string) $row['password_hash'])) {
            throw new AuthException('Invalid email or password', 401);
        }

        if (empty($row['email_verified_at'])) {
            throw new AuthException('Email verification required', 403, [
                'email_verification_required' => true,
            ]);
        }

        if (!empty($row['two_factor_enabled'])) {
            if ($twoFactorCode === '') {
                throw new AuthException('Two-factor code required', 409, [
                    'two_factor_required' => true,
                ]);
            }

            if (!$this->verifyTwoFactorCode((string) $row['two_factor_secret'], $twoFactorCode, $row['two_factor_recovery_codes'] ?? null, (int) $row['id'])) {
                throw new AuthException('Invalid two-factor code', 401);
            }
        }

        session_regenerate_id(true);
        $_SESSION['user_id'] = (int) $row['id'];
        $this->csrfToken();

        $this->db->prepare('UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = :id')
            ->execute(['id' => $row['id']]);

        return [
            'user' => $this->loadCurrentUser((int) $row['id']),
            'csrf_token' => $this->csrfToken(),
        ];
    }

    public function register(array $input): array
    {
        $this->ensureSession();

        $firstName = trim((string) ($input['first_name'] ?? ''));
        $lastName = trim((string) ($input['last_name'] ?? ''));
        $email = $this->normalizeEmail((string) ($input['email'] ?? ''));
        $password = (string) ($input['password'] ?? '');
        $passwordConfirmation = (string) ($input['password_confirmation'] ?? '');

        if ($firstName === '' || $lastName === '' || $email === '' || $password === '') {
            throw new AuthException('Missing required registration fields', 422);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new AuthException('Invalid email address', 422);
        }

        if (strlen($password) < 8) {
            throw new AuthException('Password must be at least 8 characters', 422);
        }

        if ($password !== $passwordConfirmation) {
            throw new AuthException('Password confirmation does not match', 422);
        }

        $requiredFields = [
            'phone', 'blood_type_code', 'date_of_birth', 'gender', 'weight_kg', 'city', 'address',
        ];

        foreach ($requiredFields as $field) {
            if (!array_key_exists($field, $input) || trim((string) $input[$field]) === '') {
                throw new AuthException('Missing required field: ' . $field, 422);
            }
        }

        $existing = $this->db->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
        $existing->execute(['email' => $email]);
        if ($existing->fetch()) {
            throw new AuthException('Email is already registered', 409);
        }

        $verificationToken = $this->generateToken();
        $verificationTokenHash = hash('sha256', $verificationToken);
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);

        $stmt = $this->db->prepare(
            'INSERT INTO users (
                first_name, last_name, email, phone, blood_type_code, date_of_birth, gender, weight_kg,
                city, address, join_date, total_donations, last_donation_date, next_eligible_date,
                saved_lives, points, donor_level, is_eligible, email_verified_at,
                email_verification_token_hash, email_verification_expires_at, password_hash, role,
                two_factor_enabled, two_factor_secret, two_factor_recovery_codes, deleted_at, last_login_at
            ) VALUES (
                :first_name, :last_name, :email, :phone, :blood_type_code, :date_of_birth, :gender, :weight_kg,
                :city, :address, NOW(), 0, NULL, NULL,
                0, 0, :donor_level, TRUE, NULL,
                :verification_hash, :verification_expires, :password_hash, :role,
                FALSE, NULL, :two_factor_recovery_codes, NULL, NULL
            ) RETURNING id'
        );

        $stmt->execute([
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $email,
            'phone' => trim((string) $input['phone']),
            'blood_type_code' => trim((string) $input['blood_type_code']),
            'date_of_birth' => $input['date_of_birth'],
            'gender' => trim((string) $input['gender']),
            'weight_kg' => (float) $input['weight_kg'],
            'city' => trim((string) $input['city']),
            'address' => trim((string) $input['address']),
            'donor_level' => 'New Donor',
            'verification_hash' => $verificationTokenHash,
            'verification_expires' => (new DateTimeImmutable('+24 hours'))->format('Y-m-d H:i:sP'),
            'password_hash' => $passwordHash,
            'role' => 'user',
            'two_factor_recovery_codes' => json_encode([]),
        ]);

        $userId = (int) ($stmt->fetch()['id'] ?? 0);

        if (!empty($input['medical_conditions']) && is_array($input['medical_conditions'])) {
            $conditionStmt = $this->db->prepare('INSERT INTO user_medical_conditions (user_id, condition_name) VALUES (:user_id, :condition_name)');
            foreach ($input['medical_conditions'] as $condition) {
                $condition = trim((string) $condition);
                if ($condition !== '') {
                    $conditionStmt->execute(['user_id' => $userId, 'condition_name' => $condition]);
                }
            }
        }

        if (array_key_exists('emergency_contact_name', $input) || array_key_exists('emergency_contact_phone', $input) || array_key_exists('emergency_contact_relation', $input)) {
            $this->db->prepare('INSERT INTO user_emergency_contacts (user_id, full_name, phone, relation) VALUES (:user_id, :full_name, :phone, :relation)')
                ->execute([
                    'user_id' => $userId,
                    'full_name' => trim((string) ($input['emergency_contact_name'] ?? '')),
                    'phone' => trim((string) ($input['emergency_contact_phone'] ?? '')),
                    'relation' => trim((string) ($input['emergency_contact_relation'] ?? '')),
                ]);
        }

        $this->sendVerificationNotice($email, $verificationToken);

        return [
            'message' => 'Account created. Please verify your email address.',
            'user_id' => $userId,
            'verification_link' => getenv('APP_ENV') === 'development' ? '/api/auth/verify-email?token=' . urlencode($verificationToken) : null,
        ];
    }

    public function verifyEmail(string $token): array
    {
        $token = trim($token);
        if ($token === '') {
            throw new AuthException('Verification token is required', 422);
        }

        $stmt = $this->db->prepare('SELECT id, email_verification_expires_at FROM users WHERE email_verification_token_hash = :hash AND deleted_at IS NULL LIMIT 1');
        $stmt->execute(['hash' => hash('sha256', $token)]);
        $row = $stmt->fetch();

        if (!$row) {
            throw new AuthException('Invalid or expired verification token', 400);
        }

        if (!empty($row['email_verification_expires_at']) && new DateTimeImmutable((string) $row['email_verification_expires_at']) < new DateTimeImmutable()) {
            throw new AuthException('Verification token expired', 400);
        }

        $this->db->prepare('UPDATE users SET email_verified_at = NOW(), email_verification_token_hash = NULL, email_verification_expires_at = NULL, updated_at = NOW() WHERE id = :id')
            ->execute(['id' => $row['id']]);

        return ['status' => 'email_verified'];
    }

    public function requestEmailVerification(array $input): array
    {
        $this->ensureSession();
        $email = $this->normalizeEmail((string) ($input['email'] ?? ''));
        $user = null;

        if ($email !== '') {
            $stmt = $this->db->prepare('SELECT id, email, email_verified_at FROM users WHERE email = :email AND deleted_at IS NULL LIMIT 1');
            $stmt->execute(['email' => $email]);
            $user = $stmt->fetch();
        } elseif (!empty($_SESSION['user_id'])) {
            $user = $this->loadUserRecord((int) $_SESSION['user_id']);
        }

        if (!$user) {
            throw new AuthException('User not found', 404);
        }

        if (!empty($user['email_verified_at'])) {
            return ['status' => 'already_verified'];
        }

        $token = $this->generateToken();
        $this->db->prepare('UPDATE users SET email_verification_token_hash = :hash, email_verification_expires_at = :expires, updated_at = NOW() WHERE id = :id')
            ->execute([
                'hash' => hash('sha256', $token),
                'expires' => (new DateTimeImmutable('+24 hours'))->format('Y-m-d H:i:sP'),
                'id' => $user['id'],
            ]);

        $this->sendVerificationNotice((string) $user['email'], $token);

        return [
            'status' => 'verification_sent',
            'verification_link' => getenv('APP_ENV') === 'development' ? '/api/auth/verify-email?token=' . urlencode($token) : null,
        ];
    }

    public function forgotPassword(array $input): array
    {
        $email = $this->normalizeEmail((string) ($input['email'] ?? ''));
        if ($email === '') {
            throw new AuthException('Email is required', 422);
        }

        $stmt = $this->db->prepare('SELECT id, email FROM users WHERE email = :email AND deleted_at IS NULL LIMIT 1');
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch();

        if (!$user) {
            return ['status' => 'reset_email_sent'];
        }

        $token = $this->generateToken();
        $this->db->prepare('UPDATE users SET password_reset_token_hash = :hash, password_reset_expires_at = :expires, updated_at = NOW() WHERE id = :id')
            ->execute([
                'hash' => hash('sha256', $token),
                'expires' => (new DateTimeImmutable('+1 hour'))->format('Y-m-d H:i:sP'),
                'id' => $user['id'],
            ]);

        $this->sendPasswordResetNotice((string) $user['email'], $token);

        return [
            'status' => 'reset_email_sent',
            'reset_link' => getenv('APP_ENV') === 'development' ? '/api/auth/password/reset?token=' . urlencode($token) : null,
        ];
    }

    public function resetPassword(array $input): array
    {
        $token = trim((string) ($input['token'] ?? ''));
        $password = (string) ($input['password'] ?? '');
        $passwordConfirmation = (string) ($input['password_confirmation'] ?? '');

        if ($token === '' || $password === '') {
            throw new AuthException('Token and password are required', 422);
        }

        if (strlen($password) < 8) {
            throw new AuthException('Password must be at least 8 characters', 422);
        }

        if ($password !== $passwordConfirmation) {
            throw new AuthException('Password confirmation does not match', 422);
        }

        $stmt = $this->db->prepare('SELECT id, password_reset_expires_at FROM users WHERE password_reset_token_hash = :hash AND deleted_at IS NULL LIMIT 1');
        $stmt->execute(['hash' => hash('sha256', $token)]);
        $user = $stmt->fetch();

        if (!$user) {
            throw new AuthException('Invalid or expired reset token', 400);
        }

        if (!empty($user['password_reset_expires_at']) && new DateTimeImmutable((string) $user['password_reset_expires_at']) < new DateTimeImmutable()) {
            throw new AuthException('Reset token expired', 400);
        }

        $this->db->prepare('UPDATE users SET password_hash = :hash, password_reset_token_hash = NULL, password_reset_expires_at = NULL, updated_at = NOW() WHERE id = :id')
            ->execute([
                'hash' => password_hash($password, PASSWORD_BCRYPT),
                'id' => $user['id'],
            ]);

        return ['status' => 'password_reset'];
    }

    public function updateProfile(array $input): array
    {
        $user = $this->requireAuth();
        $userId = (int) $user['id'];

        $fields = [
            'first_name' => trim((string) ($input['first_name'] ?? $user['first_name'])),
            'last_name' => trim((string) ($input['last_name'] ?? $user['last_name'])),
            'phone' => trim((string) ($input['phone'] ?? $user['phone'])),
            'blood_type_code' => trim((string) ($input['blood_type_code'] ?? $user['blood_type_code'])),
            'date_of_birth' => (string) ($input['date_of_birth'] ?? $user['date_of_birth']),
            'gender' => trim((string) ($input['gender'] ?? $user['gender'])),
            'weight_kg' => $input['weight_kg'] ?? $user['weight_kg'],
            'city' => trim((string) ($input['city'] ?? $user['city'])),
            'address' => trim((string) ($input['address'] ?? $user['address'])),
        ];

        $email = isset($input['email']) ? $this->normalizeEmail((string) $input['email']) : (string) $user['email'];
        $currentPassword = (string) ($input['current_password'] ?? '');
        $newPassword = (string) ($input['new_password'] ?? '');
        $newPasswordConfirmation = (string) ($input['new_password_confirmation'] ?? '');
        $emailChanged = $email !== (string) $user['email'];

        if ($emailChanged) {
            if ($currentPassword === '' || !password_verify($currentPassword, (string) $user['password_hash'])) {
                throw new AuthException('Current password is required to change email', 422);
            }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new AuthException('Invalid email address', 422);
            }
        }

        if ($newPassword !== '') {
            if ($currentPassword === '' || !password_verify($currentPassword, (string) $user['password_hash'])) {
                throw new AuthException('Current password is required to change password', 422);
            }
            if (strlen($newPassword) < 8) {
                throw new AuthException('New password must be at least 8 characters', 422);
            }
            if ($newPassword !== $newPasswordConfirmation) {
                throw new AuthException('Password confirmation does not match', 422);
            }
        }

        $this->db->beginTransaction();

        try {
            $sql = 'UPDATE users SET
                first_name = :first_name,
                last_name = :last_name,
                email = :email,
                phone = :phone,
                blood_type_code = :blood_type_code,
                date_of_birth = :date_of_birth,
                gender = :gender,
                weight_kg = :weight_kg,
                city = :city,
                address = :address,
                email_verified_at = ' . ($emailChanged ? 'NULL' : 'email_verified_at') . ',
                email_verification_token_hash = ' . ($emailChanged ? ':verification_hash' : 'email_verification_token_hash') . ',
                email_verification_expires_at = ' . ($emailChanged ? ':verification_expires' : 'email_verification_expires_at') . ',
                password_hash = ' . ($newPassword !== '' ? ':password_hash' : 'password_hash') . ',
                updated_at = NOW()
                WHERE id = :id';

            $params = [
                'id' => $userId,
                'first_name' => $fields['first_name'],
                'last_name' => $fields['last_name'],
                'email' => $email,
                'phone' => $fields['phone'],
                'blood_type_code' => $fields['blood_type_code'],
                'date_of_birth' => $fields['date_of_birth'],
                'gender' => $fields['gender'],
                'weight_kg' => $fields['weight_kg'],
                'city' => $fields['city'],
                'address' => $fields['address'],
            ];

            if ($emailChanged) {
                $verificationToken = $this->generateToken();
                $params['verification_hash'] = hash('sha256', $verificationToken);
                $params['verification_expires'] = (new DateTimeImmutable('+24 hours'))->format('Y-m-d H:i:sP');
            }

            if ($newPassword !== '') {
                $params['password_hash'] = password_hash($newPassword, PASSWORD_BCRYPT);
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            $hasEmergencyContactFields = array_key_exists('emergency_contact_name', $input) || array_key_exists('emergency_contact_phone', $input) || array_key_exists('emergency_contact_relation', $input);

            if ($hasEmergencyContactFields) {
                $this->db->prepare('DELETE FROM user_emergency_contacts WHERE user_id = :id')->execute(['id' => $userId]);
                $this->db->prepare('INSERT INTO user_emergency_contacts (user_id, full_name, phone, relation) VALUES (:user_id, :full_name, :phone, :relation)')
                    ->execute([
                        'user_id' => $userId,
                        'full_name' => trim((string) ($input['emergency_contact_name'] ?? '')),
                        'phone' => trim((string) ($input['emergency_contact_phone'] ?? '')),
                        'relation' => trim((string) ($input['emergency_contact_relation'] ?? '')),
                    ]);
            }

            $this->db->commit();
        } catch (PDOException $e) {
            $this->db->rollBack();
            throw new AuthException('Failed to update profile', 500);
        }

        if ($emailChanged) {
            $this->sendVerificationNotice($email, $verificationToken);
        }

        return [
            'user' => $this->loadCurrentUser($userId),
            'email_verification_required' => $emailChanged,
            'verification_link' => $emailChanged && getenv('APP_ENV') === 'development' ? '/api/auth/verify-email?token=' . urlencode($verificationToken) : null,
        ];
    }

    public function deleteAccount(): array
    {
        $user = $this->requireAuth();
        $userId = (int) $user['id'];

        $this->db->prepare('UPDATE users SET deleted_at = NOW(), updated_at = NOW() WHERE id = :id')->execute(['id' => $userId]);
        $this->logout();

        return ['status' => 'account_deleted'];
    }

    public function setupTwoFactor(): array
    {
        $user = $this->requireAuth();
        $secret = $this->generateBase32Secret();
        $recoveryCodes = $this->generateRecoveryCodes();
        $recoveryHashes = array_map(static fn(string $code): string => hash('sha256', $code), $recoveryCodes);

        $this->db->prepare('UPDATE users SET two_factor_secret = :secret, two_factor_enabled = FALSE, two_factor_recovery_codes = :codes, updated_at = NOW() WHERE id = :id')
            ->execute([
                'secret' => $secret,
                'codes' => json_encode($recoveryHashes),
                'id' => $user['id'],
            ]);

        return [
            'secret' => $secret,
            'otpauth_url' => $this->otpauthUri((string) $user['email'], $secret),
            'recovery_codes' => $recoveryCodes,
        ];
    }

    public function confirmTwoFactor(array $input): array
    {
        $user = $this->requireAuth();
        $code = trim((string) ($input['code'] ?? ''));
        if ($code === '') {
            throw new AuthException('Two-factor code is required', 422);
        }

        $fresh = $this->loadUserRecord((int) $user['id']);
        if (!$fresh || empty($fresh['two_factor_secret'])) {
            throw new AuthException('2FA setup not started', 400);
        }

        if (!$this->verifyTotp((string) $fresh['two_factor_secret'], $code)) {
            throw new AuthException('Invalid two-factor code', 422);
        }

        $this->db->prepare('UPDATE users SET two_factor_enabled = TRUE, updated_at = NOW() WHERE id = :id')->execute(['id' => $user['id']]);

        return ['status' => 'two_factor_enabled'];
    }

    public function disableTwoFactor(array $input): array
    {
        $user = $this->requireAuth();
        $password = (string) ($input['password'] ?? '');
        $code = trim((string) ($input['code'] ?? ''));
        $fresh = $this->loadUserRecord((int) $user['id']);

        if (!$fresh || !password_verify($password, (string) $fresh['password_hash'])) {
            throw new AuthException('Password is incorrect', 401);
        }

        if (!empty($fresh['two_factor_enabled'])) {
            $recoveryCodes = json_decode((string) ($fresh['two_factor_recovery_codes'] ?? '[]'), true) ?: [];
            $valid = $code !== '' && (
                $this->verifyTotp((string) $fresh['two_factor_secret'], $code) ||
                $this->consumeRecoveryCode((int) $fresh['id'], $code, $recoveryCodes)
            );

            if (!$valid) {
                throw new AuthException('Valid 2FA code or recovery code is required', 422);
            }
        }

        $this->db->prepare('UPDATE users SET two_factor_enabled = FALSE, two_factor_secret = NULL, two_factor_recovery_codes = :codes, updated_at = NOW() WHERE id = :id')
            ->execute(['codes' => json_encode([]), 'id' => $user['id']]);

        return ['status' => 'two_factor_disabled'];
    }

    public function logout(): void
    {
        $this->ensureSession();
        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], (bool) $params['secure'], (bool) $params['httponly']);
        }

        session_destroy();
    }

    public function listUsers(): array
    {
        $this->requireRole('admin');
        $stmt = $this->db->query('SELECT id, first_name, last_name, email, role, email_verified_at, last_login_at, deleted_at, created_at FROM users ORDER BY id ASC');
        return $stmt->fetchAll();
    }

    public function loadUserPayload(int $userId): array
    {
        $user = $this->loadUserRecord($userId);
        if (!$user || !empty($user['deleted_at'])) {
            throw new AuthException('User not found', 404);
        }

        $contactStmt = $this->db->prepare('SELECT full_name, phone, relation FROM user_emergency_contacts WHERE user_id = :user_id');
        $contactStmt->execute(['user_id' => $user['id']]);
        $contact = $contactStmt->fetch() ?: null;

        $conditionStmt = $this->db->prepare('SELECT condition_name FROM user_medical_conditions WHERE user_id = :user_id ORDER BY condition_name');
        $conditionStmt->execute(['user_id' => $user['id']]);
        $conditions = array_map(static fn(array $r): string => $r['condition_name'], $conditionStmt->fetchAll());

        $achievementStmt = $this->db->prepare('SELECT achievement_id FROM user_achievements WHERE user_id = :user_id ORDER BY achievement_id');
        $achievementStmt->execute(['user_id' => $user['id']]);
        $achievementIds = array_map(static fn(array $r): string => $r['achievement_id'], $achievementStmt->fetchAll());

        return $this->mapUser($user, $contact, $conditions, $achievementIds);
    }

    private function ensureSession(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        $secureCookie = getenv('SESSION_SECURE_COOKIE') === 'true';
        session_name(getenv('SESSION_NAME') ?: 'bloodlink_session');
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'domain' => '',
            'secure' => $secureCookie,
            'httponly' => true,
            'samesite' => getenv('SESSION_SAMESITE') ?: 'Lax',
        ]);
        session_start();
    }

    private function loadCurrentUser(int $userId): ?array
    {
        $user = $this->loadUserRecord($userId);
        if (!$user || !empty($user['deleted_at'])) {
            return null;
        }

        $contactStmt = $this->db->prepare('SELECT full_name, phone, relation FROM user_emergency_contacts WHERE user_id = :user_id');
        $contactStmt->execute(['user_id' => $user['id']]);
        $contact = $contactStmt->fetch() ?: null;

        $conditionStmt = $this->db->prepare('SELECT condition_name FROM user_medical_conditions WHERE user_id = :user_id ORDER BY condition_name');
        $conditionStmt->execute(['user_id' => $user['id']]);
        $conditions = array_map(static fn(array $r): string => $r['condition_name'], $conditionStmt->fetchAll());

        $achievementStmt = $this->db->prepare('SELECT achievement_id FROM user_achievements WHERE user_id = :user_id ORDER BY achievement_id');
        $achievementStmt->execute(['user_id' => $user['id']]);
        $achievementIds = array_map(static fn(array $r): string => $r['achievement_id'], $achievementStmt->fetchAll());

        return $this->mapUser($user, $contact, $conditions, $achievementIds);
    }

    private function loadUserRecord(int $userId): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $userId]);
        $user = $stmt->fetch();

        return is_array($user) ? $user : null;
    }

    private function mapUser(array $user, ?array $contact, array $conditions, array $achievementIds): array
    {
        $firstName = (string) ($user['first_name'] ?? '');
        $lastName = (string) ($user['last_name'] ?? '');
        $fullName = trim($firstName . ' ' . $lastName);

        return [
            'id' => (int) $user['id'],
            'firstName' => $firstName,
            'lastName' => $lastName,
            'fullName' => $fullName,
            'initials' => strtoupper((($firstName[0] ?? '') . ($lastName[0] ?? ''))),
            'email' => (string) $user['email'],
            'phone' => (string) $user['phone'],
            'bloodType' => (string) $user['blood_type_code'],
            'dateOfBirth' => (string) $user['date_of_birth'],
            'age' => $this->calculateAge((string) $user['date_of_birth']),
            'gender' => (string) $user['gender'],
            'weight' => (float) $user['weight_kg'],
            'city' => (string) $user['city'],
            'address' => (string) $user['address'],
            'joinDate' => (string) $user['join_date'],
            'totalDonations' => (int) $user['total_donations'],
            'lastDonation' => (string) ($user['last_donation_date'] ?? ''),
            'nextEligible' => (string) ($user['next_eligible_date'] ?? ''),
            'savedLives' => (int) $user['saved_lives'],
            'points' => (int) $user['points'],
            'level' => (string) $user['donor_level'],
            'eligible' => (bool) $user['is_eligible'],
            'medicalConditions' => $conditions,
            'emergencyContact' => [
                'name' => $contact['full_name'] ?? '',
                'phone' => $contact['phone'] ?? '',
                'relation' => $contact['relation'] ?? '',
            ],
            'achievements' => $achievementIds,
            'role' => (string) ($user['role'] ?? 'user'),
            'emailVerifiedAt' => $user['email_verified_at'] ?? null,
            'twoFactorEnabled' => (bool) ($user['two_factor_enabled'] ?? false),
            'lastLoginAt' => $user['last_login_at'] ?? null,
            'deletedAt' => $user['deleted_at'] ?? null,
        ];
    }

    private function calculateAge(string $dateOfBirth): int
    {
        if ($dateOfBirth === '') {
            return 0;
        }

        $dob = new DateTimeImmutable($dateOfBirth);
        $now = new DateTimeImmutable('now');
        $age = (int) $now->format('Y') - (int) $dob->format('Y');
        if ((int) $now->format('md') < (int) $dob->format('md')) {
            $age--;
        }

        return max(0, $age);
    }

    private function normalizeEmail(string $email): string
    {
        return strtolower(trim($email));
    }

    private function generateToken(int $bytes = 32): string
    {
        return bin2hex(random_bytes($bytes));
    }

    private function sendVerificationNotice(string $email, string $token): void
    {
        $link = $this->verificationLink($token);
        $subject = 'Verify your BloodLink email';
        $message = "Verify your email: {$link}";
        $this->deliverMail($email, $subject, $message);
    }

    private function sendPasswordResetNotice(string $email, string $token): void
    {
        $link = $this->passwordResetLink($token);
        $subject = 'Reset your BloodLink password';
        $message = "Reset your password: {$link}";
        $this->deliverMail($email, $subject, $message);
    }

    private function deliverMail(string $to, string $subject, string $message): void
    {
        if (getenv('APP_ENV') === 'development') {
            error_log(sprintf('[BloodLink mail] To: %s | Subject: %s | %s', $to, $subject, $message));
            return;
        }

        $from = getenv('MAIL_FROM_ADDRESS') ?: 'no-reply@bloodlink.local';
        $fromName = getenv('MAIL_FROM_NAME') ?: 'BloodLink';
        $headers = [
            'From: ' . $fromName . ' <' . $from . '>',
            'Content-Type: text/plain; charset=UTF-8',
        ];

        @mail($to, $subject, $message, implode("\r\n", $headers));
    }

    private function verificationLink(string $token): string
    {
        return (getenv('PUBLIC_API_BASE_URL') ?: 'http://localhost:8080/api') . '/auth/verify-email?token=' . urlencode($token);
    }

    private function passwordResetLink(string $token): string
    {
        return (getenv('PUBLIC_API_BASE_URL') ?: 'http://localhost:8080/api') . '/auth/password/reset?token=' . urlencode($token);
    }

    private function generateBase32Secret(int $length = 16): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = '';
        for ($i = 0; $i < $length; $i++) {
            $secret .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }

        return $secret;
    }

    private function generateRecoveryCodes(int $count = 8): array
    {
        $codes = [];
        for ($i = 0; $i < $count; $i++) {
            $codes[] = strtoupper(bin2hex(random_bytes(4)));
        }

        return $codes;
    }

    private function otpauthUri(string $email, string $secret): string
    {
        $issuer = rawurlencode('BloodLink');
        $label = rawurlencode('BloodLink:' . $email);

        return sprintf('otpauth://totp/%s?secret=%s&issuer=%s&algorithm=SHA1&digits=6&period=30', $label, $secret, $issuer);
    }

    private function verifyTwoFactorCode(string $secret, string $code, mixed $recoveryCodesRaw, int $userId): bool
    {
        if ($this->verifyTotp($secret, $code)) {
            return true;
        }

        $recoveryCodes = json_decode((string) ($recoveryCodesRaw ?: '[]'), true);
        if (!is_array($recoveryCodes)) {
            return false;
        }

        return $this->consumeRecoveryCode($userId, $code, $recoveryCodes);
    }

    private function consumeRecoveryCode(int $userId, string $code, array $recoveryCodes): bool
    {
        $hash = hash('sha256', strtoupper(trim($code)));
        $remaining = [];
        $matched = false;

        foreach ($recoveryCodes as $storedHash) {
            if (hash_equals((string) $storedHash, $hash)) {
                $matched = true;
                continue;
            }
            $remaining[] = $storedHash;
        }

        if ($matched) {
            $this->db->prepare('UPDATE users SET two_factor_recovery_codes = :codes, updated_at = NOW() WHERE id = :id')
                ->execute(['codes' => json_encode($remaining), 'id' => $userId]);
        }

        return $matched;
    }

    private function verifyTotp(string $secret, string $code): bool
    {
        $code = preg_replace('/\D+/', '', $code) ?? '';
        if ($code === '') {
            return false;
        }

        $secretBytes = $this->base32Decode($secret);
        if ($secretBytes === '') {
            return false;
        }

        $time = (int) floor(time() / 30);
        foreach ([$time - 1, $time, $time + 1] as $slice) {
            $calculated = $this->totpAt($secretBytes, $slice);
            if (hash_equals($calculated, str_pad($code, 6, '0', STR_PAD_LEFT))) {
                return true;
            }
        }

        return false;
    }

    private function totpAt(string $secretBytes, int $counter): string
    {
        $binaryCounter = pack('N*', 0) . pack('N*', $counter);
        $hash = hash_hmac('sha1', $binaryCounter, $secretBytes, true);
        $offset = ord($hash[19]) & 0x0f;
        $value = (
            ((ord($hash[$offset]) & 0x7f) << 24)
            | ((ord($hash[$offset + 1]) & 0xff) << 16)
            | ((ord($hash[$offset + 2]) & 0xff) << 8)
            | (ord($hash[$offset + 3]) & 0xff)
        ) % 1000000;

        return str_pad((string) $value, 6, '0', STR_PAD_LEFT);
    }

    private function base32Decode(string $secret): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = strtoupper(preg_replace('/[^A-Z2-7]/', '', $secret) ?? '');
        $bits = '';

        for ($i = 0, $length = strlen($secret); $i < $length; $i++) {
            $index = strpos($alphabet, $secret[$i]);
            if ($index === false) {
                return '';
            }
            $bits .= str_pad(decbin($index), 5, '0', STR_PAD_LEFT);
        }

        $bytes = '';
        foreach (str_split($bits, 8) as $chunk) {
            if (strlen($chunk) === 8) {
                $bytes .= chr(bindec($chunk));
            }
        }

        return $bytes;
    }
}
