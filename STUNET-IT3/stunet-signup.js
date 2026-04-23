/**
 * stunet-signup.js  ─  Signup page logic for stunet-signup.html
 *
 * Handles:
 *  - Signup form submission  (#signupForm)
 *  - Real-time password match validation
 *  - Password visibility toggles  (#passwordToggleSignup, #confirmPasswordToggle)
 *  - Inline OTP verification panel (shown after successful signup)
 *  - Terms checkbox  (#agreeTerms)
 *  - All error spans:
 *      #fullnameError, #emailSignupError, #passwordSignupError,
 *      #confirmPasswordError, #signupError
 */

document.addEventListener('DOMContentLoaded', () => {

  // ── Element refs (exact IDs from stunet-signup.html) ─────────────────────
  const signupForm            = document.getElementById('signupForm');
  const fullnameInput         = document.getElementById('fullname');
  const emailInput            = document.getElementById('email-signup');
  const passwordInput         = document.getElementById('password-signup');
  const confirmPasswordInput  = document.getElementById('confirm-password');
  const agreeTerms            = document.getElementById('agreeTerms');
  const passwordToggleSignup  = document.getElementById('passwordToggleSignup');
  const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');

  const fullnameError         = document.getElementById('fullnameError');
  const emailSignupError      = document.getElementById('emailSignupError');
  const passwordSignupError   = document.getElementById('passwordSignupError');
  const confirmPasswordError  = document.getElementById('confirmPasswordError');
  const signupError           = document.getElementById('signupError');

  // ── Password visibility toggles ──────────────────────────────────────────
  passwordToggleSignup.addEventListener('click', () =>
    toggleVisibility(passwordInput, passwordToggleSignup));

  confirmPasswordToggle.addEventListener('click', () =>
    toggleVisibility(confirmPasswordInput, confirmPasswordToggle));

  // ── Real-time confirm-password match ─────────────────────────────────────
  confirmPasswordInput.addEventListener('input', () => {
    if (confirmPasswordInput.value && confirmPasswordInput.value !== passwordInput.value) {
      showError(confirmPasswordError, confirmPasswordInput, 'Passwords do not match.');
    } else {
      clearError(confirmPasswordError, confirmPasswordInput);
    }
  });

  // ── Clear errors on input ─────────────────────────────────────────────────
  fullnameInput.addEventListener('input',        () => clearError(fullnameError,        fullnameInput));
  emailInput.addEventListener('input',           () => clearError(emailSignupError,     emailInput));
  passwordInput.addEventListener('input',        () => clearError(passwordSignupError,  passwordInput));

  // ── Signup form submit ────────────────────────────────────────────────────
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors();

    const fullName = fullnameInput.value.trim();
    const email    = emailInput.value.trim();
    const password = passwordInput.value;
    const confirm  = confirmPasswordInput.value;

    // ── Validate ──────────────────────────────────────────────────────────
    let valid = true;

    if (!fullName) {
      showError(fullnameError, fullnameInput, 'Full name is required.');
      valid = false;
    } else if (fullName.length < 2) {
      showError(fullnameError, fullnameInput, 'Name must be at least 2 characters.');
      valid = false;
    }

    if (!email) {
      showError(emailSignupError, emailInput, 'Email address is required.');
      valid = false;
    } else if (!isValidEmail(email)) {
      showError(emailSignupError, emailInput, 'Please enter a valid email address.');
      valid = false;
    }

    if (!password) {
      showError(passwordSignupError, passwordInput, 'Password is required.');
      valid = false;
    } else if (password.length < 6) {
      showError(passwordSignupError, passwordInput, 'Password must be at least 6 characters.');
      valid = false;
    }

    if (!confirm) {
      showError(confirmPasswordError, confirmPasswordInput, 'Please confirm your password.');
      valid = false;
    } else if (password !== confirm) {
      showError(confirmPasswordError, confirmPasswordInput, 'Passwords do not match.');
      valid = false;
    }

    if (!agreeTerms.checked) {
      signupError.textContent = 'You must agree to the Terms & Conditions.';
      valid = false;
    }

    if (!valid) return;

    // ── Submit to API ─────────────────────────────────────────────────────
    const btn     = signupForm.querySelector('.btn-login');
    const btnSpan = btn.querySelector('span');
    setLoading(btn, btnSpan, true, 'Creating account…');

    try {
      await AuthAPI.signup(fullName, email, password);

      // Store email for the OTP step
      sessionStorage.setItem('stunet_pending_email', email);

      // Hide the form and show the inline OTP panel
      setLoading(btn, btnSpan, false, 'Create Account');
      showOTPPanel(email);

    } catch (err) {
      setLoading(btn, btnSpan, false, 'Create Account');

      if (err.status === 409) {
        // Duplicate email
        showError(emailSignupError, emailInput,
          'This email is already registered. Try signing in.');
      } else {
        signupError.textContent = err.message || 'Something went wrong. Please try again.';
      }
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // OTP VERIFICATION PANEL
  // Injected below the form after a successful signup call
  // ─────────────────────────────────────────────────────────────────────────
  function showOTPPanel(email) {
    // Hide the signup form
    const formWrapper = signupForm.closest('.login-frame');
    formWrapper.style.display = 'none';

    // Build the panel
    const panel = document.createElement('article');
    panel.className = 'login-frame';
    panel.id        = 'otp-panel';
    panel.innerHTML = `
      <header class="login-header">
        <h2>Verify Email</h2>
        <p class="login-subtitle">
          We sent a 6-digit OTP to<br>
          <strong style="color:#4f46e5;">${escapeHtml(email)}</strong>
        </p>
      </header>

      <div style="margin-top:24px;">
        <!-- OTP digits -->
        <div id="otp-boxes" style="display:flex;gap:10px;justify-content:center;margin-bottom:20px;">
          ${[0,1,2,3,4,5].map(i =>
            `<input type="text" maxlength="1" inputmode="numeric"
                    class="otp-digit input-field"
                    data-index="${i}"
                    style="width:48px;height:56px;text-align:center;font-size:22px;font-weight:700;border-radius:10px;"
                    aria-label="OTP digit ${i+1}">`
          ).join('')}
        </div>

        <span class="error-message" id="otp-error" role="alert" aria-live="polite"
              style="display:block;text-align:center;margin-bottom:12px;"></span>

        <button id="otp-verify-btn" class="btn-login">
          <span>Verify Email</span>
        </button>

        <p style="text-align:center;margin-top:14px;font-size:13px;color:#aaa;">
          Didn't receive it?
          <a href="#" id="otp-resend" style="color:#4f46e5;text-decoration:none;">Resend OTP</a>
          <span id="otp-resend-timer" style="color:#666;"></span>
        </p>

        <p style="text-align:center;margin-top:10px;font-size:13px;">
          <a href="stunet-signup.html" style="color:#aaa;">← Back to Sign Up</a>
        </p>
      </div>
    `;

    formWrapper.parentNode.insertBefore(panel, formWrapper.nextSibling);

    // ── OTP digit box behaviour ───────────────────────────────────────────
    const boxes = panel.querySelectorAll('.otp-digit');
    boxes.forEach((box, i) => {
      box.addEventListener('input', () => {
        box.value = box.value.replace(/\D/g, '').slice(-1);
        if (box.value && i < 5) boxes[i + 1].focus();
        clearOtpError();
      });
      box.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !box.value && i > 0) {
          boxes[i - 1].focus();
        }
        if (e.key === 'ArrowLeft'  && i > 0) boxes[i - 1].focus();
        if (e.key === 'ArrowRight' && i < 5) boxes[i + 1].focus();
      });
      // Paste support
      box.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData)
          .getData('text').replace(/\D/g, '').slice(0, 6);
        pasted.split('').forEach((ch, idx) => {
          if (boxes[idx]) boxes[idx].value = ch;
        });
        if (pasted.length > 0) boxes[Math.min(pasted.length, 5)].focus();
      });
    });

    // Auto-focus first box
    boxes[0].focus();

    // ── Verify button ────────────────────────────────────────────────────
    document.getElementById('otp-verify-btn').addEventListener('click', async () => {
      const otp = Array.from(boxes).map(b => b.value).join('');
      if (otp.length < 6) {
        showOtpError('Please enter all 6 digits.');
        return;
      }

      const btn     = document.getElementById('otp-verify-btn');
      const btnSpan = btn.querySelector('span');
      setLoading(btn, btnSpan, true, 'Verifying…');

      try {
        const data = await AuthAPI.verifyOTP(email, otp);
        // Store tokens from verifyOTP response
        Auth.setTokens(data.token, data.refreshToken, data.user);
        sessionStorage.removeItem('stunet_pending_email');

        // Show success state then redirect
        btnSpan.textContent = '✓ Verified!';
        btn.style.background = 'linear-gradient(135deg,#3debbc,#1fb89a)';
        setTimeout(() => { window.location.href = 'index.html'; }, 1200);

      } catch (err) {
        setLoading(btn, btnSpan, false, 'Verify Email');
        showOtpError(err.message || 'Invalid or expired OTP. Try again.');
      }
    });

    // ── Resend with 30s cooldown ─────────────────────────────────────────
    startResendCooldown();

    document.getElementById('otp-resend').addEventListener('click', async (e) => {
      e.preventDefault();
      const resendLink  = document.getElementById('otp-resend');
      const timerEl     = document.getElementById('otp-resend-timer');
      if (resendLink.dataset.disabled === 'true') return;

      resendLink.dataset.disabled = 'true';
      resendLink.style.opacity    = '0.5';
      try {
        await AuthAPI.resendOTP(email);
        timerEl.textContent = ' – New OTP sent!';
        startResendCooldown();
      } catch (err) {
        showOtpError('Could not resend OTP. Please try again.');
        resendLink.dataset.disabled = 'false';
        resendLink.style.opacity    = '1';
      }
    });

    function startResendCooldown() {
      const resendLink = document.getElementById('otp-resend');
      const timerEl    = document.getElementById('otp-resend-timer');
      if (!resendLink) return;
      let secs = 30;
      resendLink.dataset.disabled = 'true';
      resendLink.style.opacity    = '0.5';
      timerEl.textContent         = ` (${secs}s)`;
      const iv = setInterval(() => {
        secs--;
        if (!document.getElementById('otp-resend')) { clearInterval(iv); return; }
        if (secs <= 0) {
          clearInterval(iv);
          timerEl.textContent         = '';
          resendLink.dataset.disabled = 'false';
          resendLink.style.opacity    = '1';
        } else {
          timerEl.textContent = ` (${secs}s)`;
        }
      }, 1000);
    }

    function showOtpError(msg) {
      document.getElementById('otp-error').textContent = msg;
      boxes.forEach(b => b.classList.add('input-error'));
    }
    function clearOtpError() {
      const el = document.getElementById('otp-error');
      if (el) el.textContent = '';
      boxes.forEach(b => b.classList.remove('input-error'));
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────
  function toggleVisibility(input, btn) {
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    btn.querySelector('i').className = isHidden ? 'fas fa-eye-slash' : 'fas fa-eye';
  }
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
    clearError(fullnameError,        fullnameInput);
    clearError(emailSignupError,     emailInput);
    clearError(passwordSignupError,  passwordInput);
    clearError(confirmPasswordError, confirmPasswordInput);
    signupError.textContent = '';
  }
  function setLoading(btn, span, loading, label) {
    btn.disabled     = loading;
    span.textContent = label;
  }
  function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, c =>
      ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }
});