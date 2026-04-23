/**
 * stunet.js  ─  Login page logic for stunet.html
 *
 * Handles:
 *  - Login form submission  (#loginForm)
 *  - Password visibility toggle  (#passwordToggle)
 *  - "Forgot Password?" flow (inline modal)
 *  - "Remember me" checkbox  (#rememberMe)
 *  - Field-level validation with error spans
 */

// ─── Wait for DOM ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // ── Element refs (matching exact IDs in stunet.html) ──────────────────────
  const loginForm      = document.getElementById('loginForm');
  const emailInput     = document.getElementById('email');
  const passwordInput  = document.getElementById('password');
  const passwordToggle = document.getElementById('passwordToggle');
  const rememberMe     = document.getElementById('rememberMe');
  const forgotLink     = document.querySelector('.forgot-link');

  const emailError    = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');

  // ── Pre-fill email from "remember me" ────────────────────────────────────
  const savedEmail = localStorage.getItem('stunet_remembered_email');
  if (savedEmail) {
    emailInput.value = savedEmail;
    rememberMe.checked = true;
  }

  // ── Password toggle ───────────────────────────────────────────────────────
  passwordToggle.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    passwordToggle.querySelector('i').className = isHidden
      ? 'fas fa-eye-slash'
      : 'fas fa-eye';
  });

  // ── Clear errors on input ─────────────────────────────────────────────────
  emailInput.addEventListener('input',    () => clearError(emailError,    emailInput));
  passwordInput.addEventListener('input', () => clearError(passwordError, passwordInput));

  // ── Login form submit ─────────────────────────────────────────────────────
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors();

    const email    = emailInput.value.trim();
    const password = passwordInput.value;

    // Client-side validation
    let valid = true;
    if (!email) {
      showError(emailError, emailInput, 'Email address is required.');
      valid = false;
    } else if (!isValidEmail(email)) {
      showError(emailError, emailInput, 'Please enter a valid email address.');
      valid = false;
    }
    if (!password) {
      showError(passwordError, passwordInput, 'Password is required.');
      valid = false;
    }
    if (!valid) return;

    // Submit
    const btn      = loginForm.querySelector('.btn-login');
    const btnSpan  = btn.querySelector('span');
    setLoading(btn, btnSpan, true, 'Signing in…');

    try {
      await AuthAPI.login(email, password);

      // Remember me
      if (rememberMe.checked) {
        localStorage.setItem('stunet_remembered_email', email);
      } else {
        localStorage.removeItem('stunet_remembered_email');
      }

      // Success → redirect to dashboard
      window.location.href = 'index.html';

    } catch (err) {
      setLoading(btn, btnSpan, false, 'Sign In');

      if (err.status === 403 && err.data?.needsVerification) {
        // Account exists but email not verified → go to OTP page
        sessionStorage.setItem('stunet_pending_email', email);
        showError(emailError, emailInput,
          'Email not verified. Redirecting to verify…');
        setTimeout(() => {
          window.location.href = 'stunet-otp.html';
        }, 1800);
        return;
      }
      // Show error on password field (don't reveal which is wrong)
      showError(passwordError, passwordInput,
        err.message || 'Invalid email or password.');
    }
  });

  // ── Forgot Password flow ──────────────────────────────────────────────────
  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    showForgotModal();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // FORGOT PASSWORD MODAL (inlined, no extra HTML file needed)
  // ─────────────────────────────────────────────────────────────────────────
  function showForgotModal() {
    const existing = document.getElementById('stunet-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'stunet-modal-overlay';
    overlay.innerHTML = `
      <div class="stunet-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button class="stunet-modal-close" aria-label="Close">&times;</button>

        <!-- Step 1: enter email -->
        <div id="fp-step-email">
          <h3 id="modal-title">Reset Password</h3>
          <p>Enter your registered email and we'll send you an OTP.</p>
          <div class="form-group" style="margin-top:16px;">
            <div class="input-wrapper">
              <i class="fas fa-envelope input-icon" aria-hidden="true"></i>
              <input type="email" id="fp-email" class="input-field" placeholder="you@example.com">
            </div>
            <span class="error-message" id="fp-email-error" role="alert"></span>
          </div>
          <button id="fp-send-btn" class="btn-login" style="margin-top:12px;">
            <span>Send OTP</span>
          </button>
        </div>

        <!-- Step 2: enter OTP + new password -->
        <div id="fp-step-otp" style="display:none;">
          <h3 id="modal-title">Enter OTP</h3>
          <p id="fp-otp-msg">OTP sent! Enter it below along with your new password.</p>
          <div class="form-group" style="margin-top:16px;">
            <div class="input-wrapper">
              <i class="fas fa-key input-icon" aria-hidden="true"></i>
              <input type="text" id="fp-otp" class="input-field" placeholder="6-digit OTP"
                     maxlength="6" inputmode="numeric" autocomplete="one-time-code">
            </div>
          </div>
          <div class="form-group">
            <div class="input-wrapper">
              <i class="fas fa-lock input-icon" aria-hidden="true"></i>
              <input type="password" id="fp-newpass" class="input-field" placeholder="New password">
            </div>
          </div>
          <span class="error-message" id="fp-otp-error" role="alert"></span>
          <button id="fp-reset-btn" class="btn-login" style="margin-top:12px;">
            <span>Reset Password</span>
          </button>
          <p style="margin-top:10px;font-size:13px;color:#aaa;">
            Didn't receive it? <a href="#" id="fp-resend" style="color:#4f46e5;">Resend OTP</a>
          </p>
        </div>

        <!-- Step 3: success -->
        <div id="fp-step-done" style="display:none;text-align:center;">
          <i class="fas fa-check-circle" style="font-size:48px;color:#3debbc;margin:16px 0;display:block;"></i>
          <h3>Password Reset!</h3>
          <p>You can now sign in with your new password.</p>
          <button id="fp-done-btn" class="btn-login" style="margin-top:16px;"><span>Sign In</span></button>
        </div>
      </div>
    `;
    applyModalStyles(overlay);
    document.body.appendChild(overlay);

    let fpEmail = '';

    // Close
    overlay.querySelector('.stunet-modal-close').onclick = () => overlay.remove();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    // Step 1: send OTP
    document.getElementById('fp-send-btn').addEventListener('click', async () => {
      fpEmail = document.getElementById('fp-email').value.trim();
      const errEl = document.getElementById('fp-email-error');
      errEl.textContent = '';
      if (!fpEmail || !isValidEmail(fpEmail)) {
        errEl.textContent = 'Please enter a valid email address.';
        return;
      }
      const btn = document.getElementById('fp-send-btn');
      btn.disabled = true; btn.querySelector('span').textContent = 'Sending…';
      try {
        await AuthAPI.forgotPassword(fpEmail);
        document.getElementById('fp-step-email').style.display = 'none';
        document.getElementById('fp-step-otp').style.display   = 'block';
      } catch (err) {
        errEl.textContent = err.message || 'Could not send OTP. Try again.';
        btn.disabled = false; btn.querySelector('span').textContent = 'Send OTP';
      }
    });

    // Step 2: reset password
    document.getElementById('fp-reset-btn').addEventListener('click', async () => {
      const otp     = document.getElementById('fp-otp').value.trim();
      const newpass = document.getElementById('fp-newpass').value;
      const errEl   = document.getElementById('fp-otp-error');
      errEl.textContent = '';
      if (!otp || otp.length < 6)    { errEl.textContent = 'Enter the 6-digit OTP.'; return; }
      if (newpass.length < 6)        { errEl.textContent = 'Password must be at least 6 characters.'; return; }

      const btn = document.getElementById('fp-reset-btn');
      btn.disabled = true; btn.querySelector('span').textContent = 'Resetting…';
      try {
        await AuthAPI.resetPassword(fpEmail, otp, newpass);
        document.getElementById('fp-step-otp').style.display  = 'none';
        document.getElementById('fp-step-done').style.display = 'block';
      } catch (err) {
        errEl.textContent = err.message || 'Invalid or expired OTP.';
        btn.disabled = false; btn.querySelector('span').textContent = 'Reset Password';
      }
    });

    // Resend
    document.getElementById('fp-resend').addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await AuthAPI.resendOTP(fpEmail);
        document.getElementById('fp-otp-msg').textContent = 'New OTP sent!';
      } catch (_) {
        document.getElementById('fp-otp-error').textContent = 'Could not resend. Try again.';
      }
    });

    // Done
    document.getElementById('fp-done-btn').addEventListener('click', () => overlay.remove());
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────
  function showError(span, input, msg) {
    span.textContent = msg;
    input.classList.add('input-error');
    input.setAttribute('aria-invalid', 'true');
  }
  function clearError(span, input) {
    span.textContent = '';
    input.classList.remove('input-error');
    input.removeAttribute('aria-invalid');
  }
  function clearAllErrors() {
    clearError(emailError,    emailInput);
    clearError(passwordError, passwordInput);
  }
  function setLoading(btn, span, loading, label) {
    btn.disabled     = loading;
    span.textContent = label;
  }
  function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  function applyModalStyles(overlay) {
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: '9999', backdropFilter: 'blur(4px)',
    });
    // We style .stunet-modal via inline style on the element
    overlay.querySelector('.stunet-modal').setAttribute('style', `
      background: #12121e; border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px; padding: 32px; width: 100%; max-width: 420px;
      position: relative; color: #e0e0e0; font-family: Inter, sans-serif;
    `);
    const closeBtn = overlay.querySelector('.stunet-modal-close');
    Object.assign(closeBtn.style, {
      position: 'absolute', top: '12px', right: '16px',
      background: 'none', border: 'none', color: '#aaa',
      fontSize: '24px', cursor: 'pointer', lineHeight: '1',
    });
  }
});