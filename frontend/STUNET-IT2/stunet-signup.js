// ===== API CONFIG =====
const API_BASE_URL = 'http://localhost:5000';

// ===== DOM ELEMENTS =====
const signupForm = document.getElementById('signupForm');
const fullnameInput = document.getElementById('fullname');
const emailInput = document.getElementById('email-signup');
const passwordInput = document.getElementById('password-signup');
const confirmPasswordInput = document.getElementById('confirm-password');
const passwordToggleSignup = document.getElementById('passwordToggleSignup');
const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
const agreeTerms = document.getElementById('agreeTerms');

const fullnameError = document.getElementById('fullnameError');
const emailSignupError = document.getElementById('emailSignupError');
const passwordSignupError = document.getElementById('passwordSignupError');
const confirmPasswordError = document.getElementById('confirmPasswordError');

// ===== VALIDATION FUNCTIONS =====
function validateFullName(fullname) {
    return fullname.trim().length >= 2;
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

function validatePassword(password) {
    return password.trim().length >= 8;
}

function passwordStrength(password) {
    if (password.length < 8) return 'weak';
    if (!/[A-Z]/.test(password)) return 'weak';
    if (!/[0-9]/.test(password)) return 'weak';
    if (!/[!@#$%^&*]/.test(password)) return 'medium';
    return 'strong';
}

function clearError(errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
}

function showError(errorElement, message) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// ===== FIELD VALIDATION LISTENERS =====
fullnameInput.addEventListener('blur', () => {
    const fullname = fullnameInput.value.trim();
    if (fullname === '') { clearError(fullnameError); }
    else if (!validateFullName(fullname)) { showError(fullnameError, 'Full name must be at least 2 characters'); }
    else { clearError(fullnameError); }
});
fullnameInput.addEventListener('input', () => { clearError(fullnameError); });

emailInput.addEventListener('blur', () => {
    const email = emailInput.value.trim();
    if (email === '') { clearError(emailSignupError); }
    else if (!validateEmail(email)) { showError(emailSignupError, 'Please enter a valid email address'); }
    else { clearError(emailSignupError); }
});
emailInput.addEventListener('input', () => { clearError(emailSignupError); });

passwordInput.addEventListener('blur', () => {
    const password = passwordInput.value;
    if (password === '') { clearError(passwordSignupError); }
    else if (!validatePassword(password)) { showError(passwordSignupError, 'Password must be at least 8 characters'); }
    else {
        const strength = passwordStrength(password);
        if (strength === 'weak') { showError(passwordSignupError, 'Weak password. Add uppercase, numbers & symbols'); }
        else if (strength === 'medium') { showError(passwordSignupError, 'Add special characters to strengthen'); }
        else { clearError(passwordSignupError); }
    }
});
passwordInput.addEventListener('input', () => {
    clearError(passwordSignupError);
    if (confirmPasswordInput.value && passwordInput.value !== confirmPasswordInput.value) {
        showError(confirmPasswordError, 'Passwords do not match');
    } else { clearError(confirmPasswordError); }
});

confirmPasswordInput.addEventListener('blur', () => {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    if (confirmPassword === '') { clearError(confirmPasswordError); }
    else if (password !== confirmPassword) { showError(confirmPasswordError, 'Passwords do not match'); }
    else { clearError(confirmPasswordError); }
});
confirmPasswordInput.addEventListener('input', () => {
    if (confirmPasswordInput.value && passwordInput.value !== confirmPasswordInput.value) {
        showError(confirmPasswordError, 'Passwords do not match');
    } else { clearError(confirmPasswordError); }
});

// ===== PASSWORD VISIBILITY TOGGLES =====
passwordToggleSignup.addEventListener('click', (e) => {
    e.preventDefault();
    const isVisible = passwordInput.type === 'text';
    passwordInput.type = isVisible ? 'password' : 'text';
    passwordToggleSignup.innerHTML = isVisible ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    passwordToggleSignup.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
});

confirmPasswordToggle.addEventListener('click', (e) => {
    e.preventDefault();
    const isVisible = confirmPasswordInput.type === 'text';
    confirmPasswordInput.type = isVisible ? 'password' : 'text';
    confirmPasswordToggle.innerHTML = isVisible ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    confirmPasswordToggle.setAttribute('aria-label', isVisible ? 'Show password' : 'Hide password');
});

// ===== FORM SUBMISSION =====
let isSubmitting = false;

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const fullname = fullnameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    let isValid = true;

    clearError(fullnameError);
    clearError(emailSignupError);
    clearError(passwordSignupError);
    clearError(confirmPasswordError);

    if (fullname === '') { showError(fullnameError, 'Full name is required'); isValid = false; }
    else if (!validateFullName(fullname)) { showError(fullnameError, 'Full name must be at least 2 characters'); isValid = false; }

    if (email === '') { showError(emailSignupError, 'Email is required'); isValid = false; }
    else if (!validateEmail(email)) { showError(emailSignupError, 'Please enter a valid email address'); isValid = false; }

    if (password === '') { showError(passwordSignupError, 'Password is required'); isValid = false; }
    else if (!validatePassword(password)) { showError(passwordSignupError, 'Password must be at least 8 characters'); isValid = false; }

    if (confirmPassword === '') { showError(confirmPasswordError, 'Please confirm your password'); isValid = false; }
    else if (password !== confirmPassword) { showError(confirmPasswordError, 'Passwords do not match'); isValid = false; }

    if (!agreeTerms.checked) { showNotification('Please agree to the Terms & Conditions', 'error'); isValid = false; }

    if (isValid) {
        await handleSignup(fullname, email, password);
    }
});

// ===== SIGNUP HANDLER — CONNECTED TO BACKEND =====
async function handleSignup(fullname, email, password) {
    const signupBtn = document.querySelector('.btn-login');
    const originalButtonText = signupBtn.innerHTML;

    try {
        isSubmitting = true;
        signupBtn.disabled = true;
        signupBtn.innerHTML = '<span>CREATING ACCOUNT...</span>';

        // Generate a username from the email (before the @)
        // Your backend /newlogin requires: username, password, name, email,
        // phoneNumber, college, year, major
        // Since your signup form only has name, email, password — we send
        // placeholder values for the extra fields. 
        // ✅ RECOMMENDED: Add those fields to your signup HTML form.
        const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

        const payload = {
            username: username,
            name: fullname,
            email: email,
            password: password,
            // These fields are required by your backend.
            // Replace with real form inputs once you add them to the HTML.
            phoneNumber: '',   // ← add <input id="phoneNumber"> to your form
            college: '',       // ← add <input id="college"> to your form
            year: '',          // ← add <input id="year"> to your form
            major: ''          // ← add <input id="major"> to your form
        };

        const response = await fetch(`${API_BASE_URL}/newlogin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.status === 'otp_sent') {
            // Store username so OTP page can use it
            sessionStorage.setItem('pendingUsername', data.username);
            sessionStorage.setItem('pendingEmail', email);

            showNotification('OTP sent to your email! Redirecting...', 'success');

            setTimeout(() => {
                window.location.href = 'stunet-otp.html';
            }, 1500);

        } else if (data.status === 'username_taken') {
            showNotification('Username already taken. Please use a different email.', 'error');
            signupBtn.disabled = false;
            signupBtn.innerHTML = originalButtonText;
            isSubmitting = false;

        } else if (data.status === 'email_registered') {
            showError(emailSignupError, 'This email is already registered.');
            signupBtn.disabled = false;
            signupBtn.innerHTML = originalButtonText;
            isSubmitting = false;

        } else if (data.status === 'invalid_email') {
            showError(emailSignupError, data.message || 'Invalid email domain. Use Gmail, Yahoo, Outlook, etc.');
            signupBtn.disabled = false;
            signupBtn.innerHTML = originalButtonText;
            isSubmitting = false;

        } else if (data.status === 'invalid_password') {
            showError(passwordSignupError, data.message || 'Password is invalid.');
            signupBtn.disabled = false;
            signupBtn.innerHTML = originalButtonText;
            isSubmitting = false;

        } else if (data.status === 'please_fill_all_fields') {
            showNotification('Please fill in all required fields.', 'error');
            signupBtn.disabled = false;
            signupBtn.innerHTML = originalButtonText;
            isSubmitting = false;

        } else if (data.status === 'email_service_error') {
            showNotification('Email service error. Please try again later.', 'error');
            signupBtn.disabled = false;
            signupBtn.innerHTML = originalButtonText;
            isSubmitting = false;

        } else {
            showNotification(data.message || 'Signup failed. Please try again.', 'error');
            signupBtn.disabled = false;
            signupBtn.innerHTML = originalButtonText;
            isSubmitting = false;
        }

    } catch (error) {
        console.error('Signup error:', error);
        showNotification('Cannot connect to server. Is Flask running?', 'error');
        signupBtn.disabled = false;
        signupBtn.innerHTML = originalButtonText;
        isSubmitting = false;
    }
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', 'status');
    notification.setAttribute('aria-live', 'polite');

    const iconClass = type === 'success' ? 'check-circle' : 'exclamation-circle';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${iconClass}" aria-hidden="true"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);
    requestAnimationFrame(() => { notification.classList.add('show'); });
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => { notification.remove(); }, 350);
    }, 4000);
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.activeElement === fullnameInput) { e.preventDefault(); emailInput.focus(); }
    if (e.key === 'Enter' && document.activeElement === emailInput) { e.preventDefault(); passwordInput.focus(); }
    if (e.key === 'Escape') {
        fullnameInput.value = ''; emailInput.value = ''; passwordInput.value = ''; confirmPasswordInput.value = '';
        passwordInput.type = 'password'; confirmPasswordInput.type = 'password';
        passwordToggleSignup.innerHTML = '<i class="fas fa-eye"></i>';
        confirmPasswordToggle.innerHTML = '<i class="fas fa-eye"></i>';
        clearError(fullnameError); clearError(emailSignupError);
        clearError(passwordSignupError); clearError(confirmPasswordError);
        fullnameInput.focus();
    }
});

// ===== CHESS PIECES INTERACTIVE EFFECTS =====
const queenImage = document.querySelector('.queen-piece');
const kingImage = document.querySelector('.king-piece');

if (queenImage && kingImage) {
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX;
        if (x < window.innerWidth / 2) {
            const intensity = 0.3 + (Math.abs(x - window.innerWidth / 4) / (window.innerWidth / 4)) * 0.3;
            queenImage.style.filter = `drop-shadow(0 0 ${25 + intensity * 15}px rgba(240, 240, 240, ${0.15 + intensity * 0.15})) drop-shadow(0 0 ${50 + intensity * 25}px rgba(240, 240, 240, ${0.08 + intensity * 0.08}))`;
            kingImage.style.filter = `drop-shadow(0 0 ${35 + intensity * 20}px rgba(240, 240, 240, ${0.2 + intensity * 0.2})) drop-shadow(0 0 ${70 + intensity * 30}px rgba(240, 240, 240, ${0.1 + intensity * 0.1}))`;
        }
    });
    document.addEventListener('mouseleave', () => {
        queenImage.style.filter = 'drop-shadow(0 0 25px rgba(240, 240, 240, 0.15)) drop-shadow(0 0 50px rgba(240, 240, 240, 0.08))';
        kingImage.style.filter = 'drop-shadow(0 0 35px rgba(240, 240, 240, 0.2)) drop-shadow(0 0 70px rgba(240, 240, 240, 0.1))';
    });
}

// ===== PERFORMANCE =====
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.style.setProperty('--transition-fast', '0.01s linear');
    document.documentElement.style.setProperty('--transition-smooth', '0.1s linear');
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    fullnameInput.focus();
});