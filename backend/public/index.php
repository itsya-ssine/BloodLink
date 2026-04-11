<?php

declare(strict_types=1);

use BloodLink\Database;
use BloodLink\Response;

require_once dirname(__DIR__) . '/src/bootstrap.php';

$allowedOrigins = array_filter(array_map('trim', explode(',', getenv('CORS_ALLOWED_ORIGINS') ?: 'http://localhost:3000')));
$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowOrigin = null;

if ($requestOrigin !== '') {
    if (in_array($requestOrigin, $allowedOrigins, true)) {
        $allowOrigin = $requestOrigin;
    } elseif (getenv('APP_ENV') === 'development') {
        $originParts = parse_url($requestOrigin);
        $originHost = $originParts['host'] ?? '';

        if (in_array($originHost, ['localhost', '127.0.0.1'], true)) {
            $allowOrigin = $requestOrigin;
        }
    }
}

if ($allowOrigin !== null) {
    header('Access-Control-Allow-Origin: ' . $allowOrigin);
    header('Vary: Origin');
}

header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$path = preg_replace('#^/api#', '', $uriPath);
$path = $path === '' ? '/' : $path;

try {
    $db = Database::connect();
} catch (Throwable $e) {
    Response::json([
        'error' => 'Database unavailable',
        'details' => (getenv('APP_DEBUG') === 'true') ? $e->getMessage() : null,
    ], 500);
}

function body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function notFound(): never
{
    Response::json(['error' => 'Not Found'], 404);
}

if ($path === '/' && $method === 'GET') {
    Response::json([
        'service' => 'BloodLink API',
        'version' => '1.0.0',
        'status' => 'ok',
    ]);
}

if ($path === '/health' && $method === 'GET') {
    $db->query('SELECT 1');
    Response::json(['status' => 'healthy']);
}

if ($path === '/global-stats' && $method === 'GET') {
    $stmt = $db->query('SELECT total_donors, donations_this_month, lives_this_year, hospitals_network, updated_at FROM global_stats WHERE id = 1');
    $stats = $stmt->fetch();
    Response::json($stats ?: []);
}

if ($path === '/blood-types' && $method === 'GET') {
    $stmt = $db->query('SELECT code FROM blood_types ORDER BY code');
    Response::json($stmt->fetchAll());
}

if ($path === '/achievements' && $method === 'GET') {
    $stmt = $db->query('SELECT id, name, description, icon_class, icon_color, sort_order FROM achievements ORDER BY sort_order, id');
    Response::json($stmt->fetchAll());
}

if ($path === '/hospitals' && $method === 'GET') {
    $stmt = $db->query('SELECT id, name, address, city, phone, operating_hours, latitude, longitude, urgency_level, distance_label, rating, available_slots FROM hospitals ORDER BY id');
    $hospitals = $stmt->fetchAll();

    $needsStmt = $db->query('SELECT hospital_id, blood_type_code FROM hospital_blood_needs ORDER BY hospital_id, blood_type_code');
    $needsRows = $needsStmt->fetchAll();

    $needsByHospital = [];
    foreach ($needsRows as $row) {
        $needsByHospital[(int) $row['hospital_id']][] = $row['blood_type_code'];
    }

    foreach ($hospitals as &$hospital) {
        $hospital['blood_needed'] = $needsByHospital[(int) $hospital['id']] ?? [];
    }

    Response::json($hospitals);
}

if (preg_match('#^/hospitals/(\d+)$#', $path, $m) && $method === 'GET') {
    $hospitalId = (int) $m[1];

    $stmt = $db->prepare('SELECT id, name, address, city, phone, operating_hours, latitude, longitude, urgency_level, distance_label, rating, available_slots FROM hospitals WHERE id = :id');
    $stmt->execute(['id' => $hospitalId]);
    $hospital = $stmt->fetch();

    if (!$hospital) {
        notFound();
    }

    $needsStmt = $db->prepare('SELECT blood_type_code FROM hospital_blood_needs WHERE hospital_id = :id ORDER BY blood_type_code');
    $needsStmt->execute(['id' => $hospitalId]);
    $hospital['blood_needed'] = array_map(static fn(array $r) => $r['blood_type_code'], $needsStmt->fetchAll());

    Response::json($hospital);
}

if ($path === '/users/current' && $method === 'GET') {
    $stmt = $db->query('SELECT * FROM users ORDER BY id LIMIT 1');
    $user = $stmt->fetch();

    if (!$user) {
        notFound();
    }

    $contactStmt = $db->prepare('SELECT full_name, phone, relation FROM user_emergency_contacts WHERE user_id = :user_id');
    $contactStmt->execute(['user_id' => $user['id']]);
    $contact = $contactStmt->fetch() ?: null;

    $conditionStmt = $db->prepare('SELECT condition_name FROM user_medical_conditions WHERE user_id = :user_id ORDER BY condition_name');
    $conditionStmt->execute(['user_id' => $user['id']]);
    $conditions = array_map(static fn(array $r) => $r['condition_name'], $conditionStmt->fetchAll());

    $achievementStmt = $db->prepare('SELECT achievement_id FROM user_achievements WHERE user_id = :user_id ORDER BY achievement_id');
    $achievementStmt->execute(['user_id' => $user['id']]);
    $achievementIds = array_map(static fn(array $r) => $r['achievement_id'], $achievementStmt->fetchAll());

    $user['emergency_contact'] = $contact;
    $user['medical_conditions'] = $conditions;
    $user['achievements'] = $achievementIds;

    Response::json($user);
}

if (preg_match('#^/users/(\d+)$#', $path, $m) && in_array($method, ['PUT', 'PATCH'], true)) {
    $userId = (int) $m[1];
    $input = body();

    $allowed = [
        'first_name', 'last_name', 'phone', 'blood_type_code', 'date_of_birth', 'gender', 'weight_kg',
        'city', 'address', 'last_donation_date', 'next_eligible_date', 'donor_level', 'is_eligible',
    ];

    $updates = [];
    $params = ['id' => $userId];

    foreach ($allowed as $field) {
        if (array_key_exists($field, $input)) {
            $updates[] = $field . ' = :' . $field;
            $params[$field] = $input[$field];
        }
    }

    if ($updates === []) {
        Response::json(['error' => 'No valid fields to update'], 422);
    }

    $sql = 'UPDATE users SET ' . implode(', ', $updates) . ', updated_at = NOW() WHERE id = :id';
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    if ($stmt->rowCount() === 0) {
        notFound();
    }

    Response::json(['status' => 'updated']);
}

if ($path === '/donations' && $method === 'GET') {
    $userId = isset($_GET['user_id']) ? (int) $_GET['user_id'] : null;

    if ($userId !== null) {
        $stmt = $db->prepare('SELECT id, donor_user_id, hospital_id, hospital_name, city, blood_type_code, donated_at, volume_ml, status, has_certificate FROM donations WHERE donor_user_id = :uid ORDER BY donated_at DESC, id DESC');
        $stmt->execute(['uid' => $userId]);
        Response::json($stmt->fetchAll());
    }

    $stmt = $db->query('SELECT id, donor_user_id, hospital_id, hospital_name, city, blood_type_code, donated_at, volume_ml, status, has_certificate FROM donations ORDER BY donated_at DESC, id DESC');
    Response::json($stmt->fetchAll());
}

if ($path === '/donations' && $method === 'POST') {
    $input = body();

    $required = ['donor_user_id', 'hospital_name', 'blood_type_code', 'donated_at', 'volume_ml'];
    foreach ($required as $field) {
        if (!array_key_exists($field, $input)) {
            Response::json(['error' => 'Missing field: ' . $field], 422);
        }
    }

    $stmt = $db->prepare(
        'INSERT INTO donations (donor_user_id, hospital_id, hospital_name, city, blood_type_code, donated_at, volume_ml, status, has_certificate)
         VALUES (:donor_user_id, :hospital_id, :hospital_name, :city, :blood_type_code, :donated_at, :volume_ml, :status, :has_certificate)
         RETURNING id'
    );

    $stmt->execute([
        'donor_user_id' => (int) $input['donor_user_id'],
        'hospital_id' => $input['hospital_id'] ?? null,
        'hospital_name' => $input['hospital_name'],
        'city' => $input['city'] ?? null,
        'blood_type_code' => $input['blood_type_code'],
        'donated_at' => $input['donated_at'],
        'volume_ml' => (int) $input['volume_ml'],
        'status' => $input['status'] ?? 'completed',
        'has_certificate' => (bool) ($input['has_certificate'] ?? false),
    ]);

    $newId = (int) ($stmt->fetch()['id'] ?? 0);
    Response::json(['id' => $newId], 201);
}

if ($path === '/requests' && $method === 'GET') {
    $urgency = $_GET['urgency'] ?? null;

    if ($urgency !== null && $urgency !== '') {
        $stmt = $db->prepare('SELECT id, patient_name, patient_age, blood_type_code, units_needed, hospital_id, hospital_name, city, urgency_level, reason, posted_at_label, contact_phone, is_verified, created_at FROM blood_requests WHERE urgency_level = :urgency ORDER BY created_at DESC, id DESC');
        $stmt->execute(['urgency' => $urgency]);
        Response::json($stmt->fetchAll());
    }

    $stmt = $db->query('SELECT id, patient_name, patient_age, blood_type_code, units_needed, hospital_id, hospital_name, city, urgency_level, reason, posted_at_label, contact_phone, is_verified, created_at FROM blood_requests ORDER BY created_at DESC, id DESC');
    Response::json($stmt->fetchAll());
}

if ($path === '/requests' && $method === 'POST') {
    $input = body();
    $required = ['patient_name', 'blood_type_code', 'units_needed', 'hospital_name', 'urgency_level', 'contact_phone'];

    foreach ($required as $field) {
        if (!array_key_exists($field, $input)) {
            Response::json(['error' => 'Missing field: ' . $field], 422);
        }
    }

    $stmt = $db->prepare(
        'INSERT INTO blood_requests (patient_name, patient_age, blood_type_code, units_needed, hospital_id, hospital_name, city, urgency_level, reason, posted_at_label, contact_phone, is_verified)
         VALUES (:patient_name, :patient_age, :blood_type_code, :units_needed, :hospital_id, :hospital_name, :city, :urgency_level, :reason, :posted_at_label, :contact_phone, :is_verified)
         RETURNING id'
    );

    $stmt->execute([
        'patient_name' => $input['patient_name'],
        'patient_age' => $input['patient_age'] ?? null,
        'blood_type_code' => $input['blood_type_code'],
        'units_needed' => (int) $input['units_needed'],
        'hospital_id' => $input['hospital_id'] ?? null,
        'hospital_name' => $input['hospital_name'],
        'city' => $input['city'] ?? null,
        'urgency_level' => $input['urgency_level'],
        'reason' => $input['reason'] ?? null,
        'posted_at_label' => $input['posted_at_label'] ?? 'Just now',
        'contact_phone' => $input['contact_phone'],
        'is_verified' => (bool) ($input['is_verified'] ?? false),
    ]);

    $newId = (int) ($stmt->fetch()['id'] ?? 0);
    Response::json(['id' => $newId], 201);
}

notFound();
