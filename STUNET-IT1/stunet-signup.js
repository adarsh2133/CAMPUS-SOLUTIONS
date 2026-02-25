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

// ===== FULL NAME VALIDATION =====
fullnameInput.addEventListener('blur', () => {
    const fullname = fullnameInput.value.trim();
    
    if (fullname === '') {
        clearError(fullnameError);
    } else if (!validateFullName(fullname)) {
        showError(fullnameError, 'Full name must be at least 2 characters');
    } else {
        clearError(fullnameError);
    }
});

fullnameInput.addEventListener('input', () => {
    clearError(fullnameError);
});

// ===== EMAIL VALIDATION =====
emailInput.addEventListener('blur', () => {
    const email = emailInput.value.trim();
    
    if (email === '') {
        clearError(emailSignupError);
    } else if (!validateEmail(email)) {
        showError(emailSignupError, 'Please enter a valid email address');
    } else {
        clearError(emailSignupError);
    }
});

emailInput.addEventListener('input', () => {
    clearError(emailSignupError);
});

// ===== PASSWORD VALIDATION =====
passwordInput.addEventListener('blur', () => {
    const password = passwordInput.value;
    
    if (password === '') {
        clearError(passwordSignupError);
    } else if (!validatePassword(password)) {
        showError(passwordSignupError, 'Password must be at least 8 characters');
    } else {
        const strength = passwordStrength(password);
        if (strength === 'weak') {
            showError(passwordSignupError, 'Password is weak. Use uppercase, numbers, and symbols');
        } else if (strength === 'medium') {
            showError(passwordSignupError, 'Password could be stronger. Add special characters');
        } else {
            clearError(passwordSignupError);
        }
    }
});

passwordInput.addEventListener('input', () => {
    clearError(passwordSignupError);
    // Check if passwords match
    if (confirmPasswordInput.value && passwordInput.value !== confirmPasswordInput.value) {
        showError(confirmPasswordError, 'Passwords do not match');
    } else {
        clearError(confirmPasswordError);
    }
});

// ===== CONFIRM PASSWORD VALIDATION =====
confirmPasswordInput.addEventListener('blur', () => {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (confirmPassword === '') {
        clearError(confirmPasswordError);
    } else if (password !== confirmPassword) {
        showError(confirmPasswordError, 'Passwords do not match');
    } else {
        clearError(confirmPasswordError);
    }
});

confirmPasswordInput.addEventListener('input', () => {
    if (confirmPasswordInput.value && passwordInput.value !== confirmPasswordInput.value) {
        showError(confirmPasswordError, 'Passwords do not match');
    } else {
        clearError(confirmPasswordError);
    }
});

// ===== PASSWORD VISIBILITY TOGGLE =====
passwordToggleSignup.addEventListener('click', (e) => {
    e.preventDefault();
    
    const isPasswordVisible = passwordInput.type === 'text';
    passwordInput.type = isPasswordVisible ? 'password' : 'text';
    
    passwordToggleSignup.innerHTML = isPasswordVisible 
        ? '<i class="fas fa-eye"></i>' 
        : '<i class="fas fa-eye-slash"></i>';
    
    passwordToggleSignup.setAttribute('aria-label', 
        isPasswordVisible ? 'Show password' : 'Hide password'
    );
});

confirmPasswordToggle.addEventListener('click', (e) => {
    e.preventDefault();
    
    const isPasswordVisible = confirmPasswordInput.type === 'text';
    confirmPasswordInput.type = isPasswordVisible ? 'password' : 'text';
    
    confirmPasswordToggle.innerHTML = isPasswordVisible 
        ? '<i class="fas fa-eye"></i>' 
        : '<i class="fas fa-eye-slash"></i>';
    
    confirmPasswordToggle.setAttribute('aria-label', 
        isPasswordVisible ? 'Show password' : 'Hide password'
    );
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

    // Clear previous errors
    clearError(fullnameError);
    clearError(emailSignupError);
    clearError(passwordSignupError);
    clearError(confirmPasswordError);

    // Validate full name
    if (fullname === '') {
        showError(fullnameError, 'Full name is required');
        isValid = false;
    } else if (!validateFullName(fullname)) {
        showError(fullnameError, 'Full name must be at least 2 characters');
        isValid = false;
    }

    // Validate email
    if (email === '') {
        showError(emailSignupError, 'Email is required');
        isValid = false;
    } else if (!validateEmail(email)) {
        showError(emailSignupError, 'Please enter a valid email address');
        isValid = false;
    }

    // Validate password
    if (password === '') {
        showError(passwordSignupError, 'Password is required');
        isValid = false;
    } else if (!validatePassword(password)) {
        showError(passwordSignupError, 'Password must be at least 8 characters');
        isValid = false;
    }

    // Validate confirm password
    if (confirmPassword === '') {
        showError(confirmPasswordError, 'Please confirm your password');
        isValid = false;
    } else if (password !== confirmPassword) {
        showError(confirmPasswordError, 'Passwords do not match');
        isValid = false;
    }

    // Validate terms
    if (!agreeTerms.checked) {
        showNotification('Please agree to the Terms & Conditions', 'error');
        isValid = false;
    }

    if (isValid) {
        await handleSignup(fullname, email, password);
    }
});

// ===== SIGNUP HANDLER =====
async function handleSignup(fullname, email, password) {
    const signupBtn = document.querySelector('.btn-login');
    const originalButtonText = signupBtn.innerHTML;

    try {
        isSubmitting = true;
        signupBtn.disabled = true;
        signupBtn.innerHTML = '<span>CREATING ACCOUNT...</span>';

        const response = await simulateApiCall(fullname, email, password);

        if (response.success) {
            showNotification('Account created successfully! Redirecting...', 'success');

            // Save user info if needed
            localStorage.setItem('stunet_user', JSON.stringify({
                fullname: fullname,
                email: email
            }));

            setTimeout(() => {
                // Redirect to login or dashboard
                // window.location.href = '/dashboard';
                console.log('Account created. Redirecting...');
            }, 1500);
        } else {
            showNotification(response.message || 'Signup failed. Please try again.', 'error');
            signupBtn.disabled = false;
            signupBtn.innerHTML = originalButtonText;
            isSubmitting = false;
        }
    } catch (error) {
        console.error('Signup error:', error);
        showNotification('An error occurred. Please try again.', 'error');
        signupBtn.disabled = false;
        signupBtn.innerHTML = originalButtonText;
        isSubmitting = false;
    }
}

// ===== SIMULATE API CALL =====
function simulateApiCall(fullname, email, password) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulated responses - Replace with actual API call
            if (email && password && fullname) {
                resolve({ success: true, token: 'dummy_token' });
            } else {
                resolve({ success: false, message: 'Missing required fields' });
            }
        }, 1200);
    });
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

    // Trigger show animation
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });

    // Remove notification after 4 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 350);
    }, 4000);
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
    // Enter key on fullname input - move to email
    if (e.key === 'Enter' && document.activeElement === fullnameInput) {
        e.preventDefault();
        emailInput.focus();
    }

    // Enter key on email input - move to password
    if (e.key === 'Enter' && document.activeElement === emailInput) {
        e.preventDefault();
        passwordInput.focus();
    }

    // Escape key - clear form
    if (e.key === 'Escape') {
        fullnameInput.value = '';
        emailInput.value = '';
        passwordInput.value = '';
        confirmPasswordInput.value = '';
        passwordInput.type = 'password';
        confirmPasswordInput.type = 'password';
        passwordToggleSignup.innerHTML = '<i class="fas fa-eye"></i>';
        confirmPasswordToggle.innerHTML = '<i class="fas fa-eye"></i>';
        clearError(fullnameError);
        clearError(emailSignupError);
        clearError(passwordSignupError);
        clearError(confirmPasswordError);
        fullnameInput.focus();
    }
});

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    fullnameInput.focus();
});

// ===== CHESS PIECES INTERACTIVE EFFECTS =====
const queenImage = document.querySelector('.queen-piece');
const kingImage = document.querySelector('.king-piece');

if (queenImage && kingImage) {
    // Add interactive glow effect on mouse move
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX;
        
        // Only apply effect if mouse is on left side (branding section)
        if (x < window.innerWidth / 2) {
            const intensity = 0.3 + (Math.abs(x - window.innerWidth / 4) / (window.innerWidth / 4)) * 0.3;
            
            // Queen piece glow
            queenImage.style.filter = `drop-shadow(0 0 ${25 + intensity * 15}px rgba(240, 240, 240, ${0.15 + intensity * 0.15})) drop-shadow(0 0 ${50 + intensity * 25}px rgba(240, 240, 240, ${0.08 + intensity * 0.08}))`;
            
            // King piece glow
            kingImage.style.filter = `drop-shadow(0 0 ${35 + intensity * 20}px rgba(240, 240, 240, ${0.2 + intensity * 0.2})) drop-shadow(0 0 ${70 + intensity * 30}px rgba(240, 240, 240, ${0.1 + intensity * 0.1}))`;
        }
    });

    // Reset glow on mouse leave
    document.addEventListener('mouseleave', () => {
        queenImage.style.filter = 'drop-shadow(0 0 25px rgba(240, 240, 240, 0.15)) drop-shadow(0 0 50px rgba(240, 240, 240, 0.08))';
        kingImage.style.filter = 'drop-shadow(0 0 35px rgba(240, 240, 240, 0.2)) drop-shadow(0 0 70px rgba(240, 240, 240, 0.1))';
    });
}

// ===== PERFORMANCE: Reduce animations on low-end devices =====
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.style.setProperty('--transition-fast', '0.01s linear');
    document.documentElement.style.setProperty('--transition-smooth', '0.1s linear');
}