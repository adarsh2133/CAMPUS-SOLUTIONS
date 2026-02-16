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
    
    // Update aria-label for accessibility
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

    // Validate email
    if (email === '') {
        showError(emailError, 'Email is required');
        isValid = false;
    } else if (!validateEmail(email)) {
        showError(emailError, 'Please enter a valid email address');
        isValid = false;
    }

    // Validate password
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

// ===== LOGIN HANDLER =====
async function handleLogin(email, password) {
    const loginBtn = document.querySelector('.btn-login');
    const originalButtonText = loginBtn.innerHTML;

    try {
        isSubmitting = true;
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span>SIGNING IN...</span>';

        const response = await simulateApiCall(email, password);

        if (response.success) {
            // Save remember me preference
            if (rememberMe.checked) {
                localStorage.setItem('stunet_email', email);
                localStorage.setItem('stunet_remember', 'true');
            } else {
                localStorage.removeItem('stunet_email');
                localStorage.removeItem('stunet_remember');
            }

            showNotification('Login successful! Redirecting...', 'success');

            setTimeout(() => {
                // window.location.href = '/dashboard';
                console.log('Redirecting to dashboard...');
            }, 1500);
        } else {
            showNotification(response.message || 'Login failed. Please try again.', 'error');
            loginBtn.disabled = false;
            loginBtn.innerHTML = originalButtonText;
            isSubmitting = false;
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('An error occurred. Please try again.', 'error');
        loginBtn.disabled = false;
        loginBtn.innerHTML = originalButtonText;
        isSubmitting = false;
    }
}

// ===== SIMULATE API CALL =====
function simulateApiCall(email, password) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Test credentials - replace with actual API call
            if (email === 'demo@example.com' && password === 'password123') {
                resolve({ success: true, token: 'dummy_token' });
            } else {
                resolve({ success: false, message: 'Invalid email or password' });
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
    // Enter key on email input - move to password
    if (e.key === 'Enter' && document.activeElement === emailInput) {
        e.preventDefault();
        passwordInput.focus();
    }

    // Escape key - clear form
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

// ===== FORGOT PASSWORD =====
const forgotLink = document.querySelector('.forgot-link');
if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Redirect to forgot password page');
        // window.location.href = '/forgot-password';
    });
}

// ===== SIGNUP LINK =====
const signupLink = document.querySelector('.signup-link');
if (signupLink) {
    signupLink.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Redirect to signup page');
        // window.location.href = '/signup';
    });
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    loadRememberedEmail();
    emailInput.focus();
});

// ===== THREE.JS ANIMATION - DISABLE IF USING IMAGE =====
// Uncomment below to use Three.js 3D model instead of image
/*
const container = document.getElementById("three-container");

if (container && container.offsetParent !== null) {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
        50,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Premium chrome material
    const material = new THREE.MeshStandardMaterial({
        color: 0xf0f0f0,
        metalness: 0.9,
        roughness: 0.1,
        envMapIntensity: 1,
    });

    // Geometric shape (queen-like form)
    const geometry = new THREE.CylinderGeometry(0.6, 0.8, 3, 64);
    const queen = new THREE.Mesh(geometry, material);
    scene.add(queen);

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        queen.rotation.y += 0.005;
        queen.rotation.x += 0.002;
        renderer.render(scene, camera);
    }

    animate();

    // Responsive resize
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}
*/

// ===== CHESS PIECES INTERACTIVE EFFECTS =====
const queenImage = document.querySelector('.queen-piece');
const kingImage = document.querySelector('.king-piece');

if (queenImage && kingImage) {
    // Add interactive glow effect on mouse move
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX;
        const y = e.clientY;
        
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