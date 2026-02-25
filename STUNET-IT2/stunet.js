// ===== API CONFIG =====
const API_BASE_URL = 'http://localhost:5000';

// ===== DOM ELEMENTS =====
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const passwordToggle = document.getElementById('passwordToggle');
const rememberMe = document.getElementById('rememberMe');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');

// ===== VALIDATION FUNCTIONS =====
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

function validatePassword(password) {
    return password.trim().length >= 6;
}

function clearError(errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
}

function showError(errorElement, message) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// ===== EMAIL INPUT VALIDATION =====
emailInput.addEventListener('blur', () => {
    const email = emailInput.value.trim();
    if (email === '') {
        clearError(emailError);
    } else if (!validateEmail(email)) {
        showError(emailError, 'Please enter a valid email address');
    } else {
        clearError(emailError);
    }
});

emailInput.addEventListener('input', () => {
    clearError(emailError);
});

// ===== PASSWORD INPUT VALIDATION =====
passwordInput.addEventListener('blur', () => {
    const password = passwordInput.value;
    if (password === '') {
        clearError(passwordError);
    } else if (!validatePassword(password)) {
        showError(passwordError, 'Password must be at least 6 characters');
    } else {
        clearError(passwordError);
    }
});

passwordInput.addEventListener('input', () => {
    clearError(passwordError);
});

// ===== PASSWORD VISIBILITY TOGGLE =====
passwordToggle.addEventListener('click', (e) => {
    e.preventDefault();
    const isPasswordVisible = passwordInput.type === 'text';
    passwordInput.type = isPasswordVisible ? 'password' : 'text';
    passwordToggle.innerHTML = isPasswordVisible
        ? '<i class="fas fa-eye"></i>'
        : '<i class="fas fa-eye-slash"></i>';
    passwordToggle.setAttribute('aria-label',
        isPasswordVisible ? 'Show password' : 'Hide password'
    );
});

// ===== FORM SUBMISSION =====
let isSubmitting = false;

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    let isValid = true;

    clearError(emailError);
    clearError(passwordError);

    if (email === '') {
        showError(emailError, 'Email is required');
        isValid = false;
    } else if (!validateEmail(email)) {
        showError(emailError, 'Please enter a valid email address');
        isValid = false;
    }

    if (password === '') {
        showError(passwordError, 'Password is required');
        isValid = false;
    } else if (!validatePassword(password)) {
        showError(passwordError, 'Password must be at least 6 characters');
        isValid = false;
    }

    if (isValid) {
        await handleLogin(email, password);
    }
});

// ===== LOGIN HANDLER — CONNECTED TO BACKEND =====
async function handleLogin(email, password) {
    const loginBtn = document.querySelector('.btn-login');
    const originalButtonText = loginBtn.innerHTML;

    try {
        isSubmitting = true;
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span>SIGNING IN...</span>';

        // ⚠️ NOTE: Your backend /login expects { username, password }
        // but your login form only has email. Two options:
        //   Option A (recommended): send email, let backend look up by email
        //   Option B: add a username field to the login form
        //
        // The code below sends email as the "username" field.
        // Update backend /login to accept email OR username if needed.
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: email, password })
        });

        const data = await response.json();

        if (data.login === true) {
            // Save remember me preference
            if (rememberMe.checked) {
                localStorage.setItem('stunet_email', email);
                localStorage.setItem('stunet_remember', 'true');
            } else {
                localStorage.removeItem('stunet_email');
                localStorage.removeItem('stunet_remember');
            }

            // Store session info
            sessionStorage.setItem('stunet_username', data.username);
            sessionStorage.setItem('stunet_name', data.name);
            sessionStorage.setItem('stunet_email', data.email);

            showNotification('Login successful! Redirecting...', 'success');

            setTimeout(() => {
                window.location.href = 'stunet-hp-1.html';
            }, 1500);

        } else if (data.status === 'email_not_verified') {
            showNotification('Please verify your email before logging in.', 'error');
            loginBtn.disabled = false;
            loginBtn.innerHTML = originalButtonText;
            isSubmitting = false;

        } else if (data.status === 'invalid_credentials') {
            showNotification('Invalid email or password. Please try again.', 'error');
            loginBtn.disabled = false;
            loginBtn.innerHTML = originalButtonText;
            isSubmitting = false;

        } else {
            showNotification(data.message || 'Login failed. Please try again.', 'error');
            loginBtn.disabled = false;
            loginBtn.innerHTML = originalButtonText;
            isSubmitting = false;
        }

    } catch (error) {
        console.error('Login error:', error);
        showNotification('Cannot connect to server. Is Flask running?', 'error');
        loginBtn.disabled = false;
        loginBtn.innerHTML = originalButtonText;
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

// ===== LOAD REMEMBERED EMAIL =====
function loadRememberedEmail() {
    if (localStorage.getItem('stunet_remember') === 'true') {
        const savedEmail = localStorage.getItem('stunet_email');
        if (savedEmail) {
            emailInput.value = savedEmail;
            rememberMe.checked = true;
        }
    }
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.activeElement === emailInput) {
        e.preventDefault();
        passwordInput.focus();
    }
    if (e.key === 'Escape') {
        emailInput.value = '';
        passwordInput.value = '';
        passwordInput.type = 'password';
        passwordToggle.innerHTML = '<i class="fas fa-eye"></i>';
        clearError(emailError);
        clearError(passwordError);
        emailInput.focus();
    }
});

// ===== FORGOT PASSWORD LINK =====
const forgotLink = document.querySelector('.forgot-link');
if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'stunet-forgot.html';
    });
}

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
    document.documentElement.style.setProperty('--transition-bounce', '0.1s linear');
}

// ===== AUTOFILL DETECTION =====
emailInput.addEventListener('animationstart', (event) => {
    if (event.animationName === 'autofill') {
        emailInput.parentElement.classList.add('autofilled');
    }
});
passwordInput.addEventListener('animationstart', (event) => {
    if (event.animationName === 'autofill') {
        passwordInput.parentElement.classList.add('autofilled');
    }
});

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    loadRememberedEmail();
    emailInput.focus();
});