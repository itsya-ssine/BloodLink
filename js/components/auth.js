const AuthComponent = (() => {
  let currentView = 'login';

  function field(value) {
    return value ?? '';
  }

  function tabs() {
    return `
      <div class="auth-tabs">
        <button class="auth-tab ${currentView === 'login' ? 'is-active' : ''}" type="button" data-view="login">Sign in</button>
        <button class="auth-tab ${currentView === 'register' ? 'is-active' : ''}" type="button" data-view="register">Create account</button>
        <button class="auth-tab ${currentView === 'forgot' ? 'is-active' : ''}" type="button" data-view="forgot">Reset password</button>
        <button class="auth-tab ${currentView === 'verify' ? 'is-active' : ''}" type="button" data-view="verify">Verify email</button>
      </div>
    `;
  }

  function shell(inner, message = '') {
    return `
      <section class="auth-shell">
        <div class="auth-card">
          <div class="auth-brand">
            <div class="auth-mark"><i class="bi bi-heart-pulse-fill"></i></div>
            <div>
              <p class="auth-kicker">BloodLink</p>
              <h1>Welcome back</h1>
              <p class="auth-copy">Manage your donations, requests, and account settings securely.</p>
            </div>
          </div>
          ${message ? `<div class="auth-message">${message}</div>` : ''}
          ${tabs()}
          ${inner}
        </div>
      </section>
    `;
  }

  function renderLogin(message = '') {
    return shell(`
      <form class="auth-form" id="authLoginForm">
        <label>
          <span>Email</span>
          <input type="email" name="email" placeholder="you@example.com" required>
        </label>
        <label>
          <span>Password</span>
          <input type="password" name="password" placeholder="Your password" required>
        </label>
        <label>
          <span>2FA code</span>
          <input type="text" name="two_factor_code" inputmode="numeric" autocomplete="one-time-code" placeholder="Optional 6-digit code">
        </label>
        <button type="submit" class="auth-submit">Sign in</button>
      </form>
      <div class="auth-links">
        <button type="button" class="auth-link" data-view="register">Create a new account</button>
        <button type="button" class="auth-link" data-view="forgot">Forgot password?</button>
      </div>
    `, message);
  }

  function renderRegister(message = '') {
    return shell(`
      <form class="auth-form auth-form-grid" id="authRegisterForm">
        <label><span>First name</span><input type="text" name="first_name" required></label>
        <label><span>Last name</span><input type="text" name="last_name" required></label>
        <label class="auth-span-2"><span>Email</span><input type="email" name="email" required></label>
        <label><span>Password</span><input type="password" name="password" minlength="8" required></label>
        <label><span>Confirm password</span><input type="password" name="password_confirmation" minlength="8" required></label>
        <label><span>Phone</span><input type="tel" name="phone" placeholder="+1 555 123 4567"></label>
        <label><span>Blood type</span><input type="text" name="blood_type_code" placeholder="O+" required></label>
        <label><span>Date of birth</span><input type="date" name="date_of_birth" required></label>
        <label><span>Gender</span><input type="text" name="gender" placeholder="Female"></label>
        <label><span>Weight (kg)</span><input type="number" name="weight_kg" min="30" step="0.1" required></label>
        <label><span>City</span><input type="text" name="city" required></label>
        <label class="auth-span-2"><span>Address</span><input type="text" name="address" required></label>
        <label class="auth-span-2"><span>Emergency contact name</span><input type="text" name="emergency_contact_name" required></label>
        <label><span>Emergency contact phone</span><input type="tel" name="emergency_contact_phone" required></label>
        <label><span>Relation</span><input type="text" name="emergency_contact_relation" required></label>
        <label class="auth-span-2"><span>Medical conditions</span><textarea name="medical_conditions" rows="3" placeholder="Comma-separated conditions, if any"></textarea></label>
        <button type="submit" class="auth-submit auth-span-2">Create account</button>
      </form>
      <div class="auth-links">
        <button type="button" class="auth-link" data-view="login">Back to sign in</button>
      </div>
    `, message);
  }

  function renderForgot(message = '') {
    return shell(`
      <form class="auth-form" id="authForgotForm">
        <label>
          <span>Email</span>
          <input type="email" name="email" placeholder="you@example.com" required>
        </label>
        <button type="submit" class="auth-submit">Send reset link</button>
      </form>
      <div class="auth-links">
        <button type="button" class="auth-link" data-view="login">Back to sign in</button>
        <button type="button" class="auth-link" data-view="verify">Verify email</button>
      </div>
    `, message);
  }

  function renderVerify(message = '') {
    return shell(`
      <form class="auth-form" id="authVerifyForm">
        <label>
          <span>Verification token</span>
          <input type="text" name="token" placeholder="Token from email" required>
        </label>
        <button type="submit" class="auth-submit">Verify email</button>
      </form>
      <div class="auth-links">
        <button type="button" class="auth-link" data-view="login">Back to sign in</button>
        <button type="button" class="auth-link" data-view="forgot">Reset password</button>
      </div>
    `, message);
  }

  function renderReset(message = '') {
    return shell(`
      <form class="auth-form auth-form-grid" id="authResetForm">
        <label class="auth-span-2"><span>Reset token</span><input type="text" name="token" placeholder="Token from email" required></label>
        <label><span>New password</span><input type="password" name="password" minlength="8" required></label>
        <label><span>Confirm password</span><input type="password" name="password_confirmation" minlength="8" required></label>
        <button type="submit" class="auth-submit auth-span-2">Reset password</button>
      </form>
      <div class="auth-links">
        <button type="button" class="auth-link" data-view="login">Back to sign in</button>
      </div>
    `, message);
  }

  function render(view = 'login', message = '') {
    currentView = view;
    if (view === 'register') return renderRegister(message);
    if (view === 'forgot') return renderForgot(message);
    if (view === 'verify') return renderVerify(message);
    if (view === 'reset') return renderReset(message);
    return renderLogin(message);
  }

  function switchView(view, message = '') {
    if (window.App) {
      window.App.renderAuthScreen(view, message);
    }
  }

  function bind(view = 'login') {
    document.querySelectorAll('[data-view]').forEach(button => {
      button.addEventListener('click', () => switchView(button.dataset.view));
    });

    const setBusy = (button, busy) => {
      if (!button) return;
      button.disabled = busy;
      button.dataset.label = button.dataset.label || button.textContent;
      button.textContent = busy ? 'Working…' : button.dataset.label;
    };

    const showMessage = (message, targetView = currentView) => {
      switchView(targetView, message);
    };

    const loginForm = document.getElementById('authLoginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async event => {
        event.preventDefault();
        const form = new FormData(loginForm);
        const submit = loginForm.querySelector('button[type="submit"]');
        setBusy(submit, true);
        try {
          await BloodLinkApi.login(Object.fromEntries(form.entries()));
          await window.App.loadApp();
        } catch (error) {
          showMessage(error.message || 'Unable to sign in');
        } finally {
          setBusy(submit, false);
        }
      });
    }

    const registerForm = document.getElementById('authRegisterForm');
    if (registerForm) {
      registerForm.addEventListener('submit', async event => {
        event.preventDefault();
        const form = new FormData(registerForm);
        const payload = Object.fromEntries(form.entries());
        payload.medical_conditions = String(payload.medical_conditions || '')
          .split(',')
          .map(item => item.trim())
          .filter(Boolean);
        const submit = registerForm.querySelector('button[type="submit"]');
        setBusy(submit, true);
        try {
          const result = await BloodLinkApi.register(payload);
          const message = result.verification_link ? `Account created. Verify your email: ${result.verification_link}` : 'Account created. Check your inbox to verify your email.';
          showMessage(message, 'login');
        } catch (error) {
          showMessage(error.message || 'Unable to create account', 'register');
        } finally {
          setBusy(submit, false);
        }
      });
    }

    const forgotForm = document.getElementById('authForgotForm');
    if (forgotForm) {
      forgotForm.addEventListener('submit', async event => {
        event.preventDefault();
        const payload = Object.fromEntries(new FormData(forgotForm).entries());
        const submit = forgotForm.querySelector('button[type="submit"]');
        setBusy(submit, true);
        try {
          const result = await BloodLinkApi.forgotPassword(payload);
          const message = result.reset_link ? `Reset link generated: ${result.reset_link}` : 'Password reset instructions have been sent.';
          showMessage(message, 'login');
        } catch (error) {
          showMessage(error.message || 'Unable to request password reset', 'forgot');
        } finally {
          setBusy(submit, false);
        }
      });
    }

    const verifyForm = document.getElementById('authVerifyForm');
    if (verifyForm) {
      verifyForm.addEventListener('submit', async event => {
        event.preventDefault();
        const payload = Object.fromEntries(new FormData(verifyForm).entries());
        const submit = verifyForm.querySelector('button[type="submit"]');
        setBusy(submit, true);
        try {
          const result = await BloodLinkApi.verifyEmail(payload.token);
          showMessage(result.message || 'Email verified. You can sign in now.', 'login');
        } catch (error) {
          showMessage(error.message || 'Unable to verify email', 'verify');
        } finally {
          setBusy(submit, false);
        }
      });
    }

    const resetForm = document.getElementById('authResetForm');
    if (resetForm) {
      resetForm.addEventListener('submit', async event => {
        event.preventDefault();
        const payload = Object.fromEntries(new FormData(resetForm).entries());
        const submit = resetForm.querySelector('button[type="submit"]');
        setBusy(submit, true);
        try {
          await BloodLinkApi.resetPassword(payload);
          showMessage('Password updated. Sign in with your new credentials.', 'login');
        } catch (error) {
          showMessage(error.message || 'Unable to reset password', 'reset');
        } finally {
          setBusy(submit, false);
        }
      });
    }
  }

  return {
    render,
    bind,
    switchView,
  };
})();

window.AuthComponent = AuthComponent;
