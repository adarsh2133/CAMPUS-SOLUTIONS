// ===== API CONFIG =====
const API_BASE_URL = 'http://localhost:5000';

// ===== DOM ELEMENTS =====
const otpForm = document.getElementById('otpForm');
const otpInputs = Array.from(document.querySelectorAll('.otp-input'));
const otpError = document.getElementById('otpError');
const resendBtn = document.getElementById('resendBtn');
const timerDisplay = document.getElementById('timer');
const verifyBtn = document.querySelector('.btn-login');

// ===== STATE =====
let timeLeft = 600; // 10 minutes
let canResend = false;
let resendCount = 0;
const MAX_RESEND_ATTEMPTS = 3;

// ===== OTP INPUT HANDLING =====
otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
        const value = e.target.value;
        
        // Only allow digits
        if (!/^\d*$/.test(value)) {
            input.value = '';
            return;
        }
        
        // Move to next input if digit entered
        if (value.length === 1 && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }
        
        // Clear error when user starts typing
        if (otpError.textContent) {
            otpError.textContent = '';
            otpError.style.display = 'none';
        }
    });

    input.addEventListener('keydown', (e) => {
        // Backspace - move to previous input
        if (e.key === 'Backspace' && !input.value && index > 0) {
            otpInputs[index - 1].focus();
        }
        
        // Allow only digits
        if (!/^\d$/.test(e.key) && !['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }
    });

    input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text');
        const digits = pastedData.replace(/\D/g, '').split('');
        
        digits.forEach((digit, i) => {
            if (index + i < otpInputs.length) {
                otpInputs[index + i].value = digit;
            }
        });
        
        if (digits.length > 0) {
            otpInputs[Math.min(index + digits.length - 1, otpInputs.length - 1)].focus();
        }
    });
});

// ===== TIMER =====
function startTimer() {
    timeLeft = 600;
    updateTimerDisplay();
    
    const timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            otpInputs.forEach(input => input.disabled = true);
            verifyBtn.disabled = true;
            showNotification('OTP expired. Please request a new one.', 'error');
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    if (timeLeft <= 60) {
        timerDisplay.style.color = '#ef4444';
    } else if (timeLeft <= 180) {
        timerDisplay.style.color = '#eab308';
    } else {
        timerDisplay.style.color = '#999999';
    }
}

// ===== FORM SUBMISSION =====
otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const otp = otpInputs.map(input => input.value).join('');
    
    if (otp.length !== 6) {
        showError(otpError, 'Please enter complete OTP');
        return;
    }
    
    await verifyOTP(otp);
});

// ===== VERIFY OTP WITH BACKEND =====
async function verifyOTP(otp) {
    const username = sessionStorage.getItem('pendingUsername');
    
    if (!username) {
        showNotification('Session expired. Please sign up again.', 'error');
        setTimeout(() => {
            window.location.href = 'stunet-signup.html';
        }, 2000);
        return;
    }

    verifyBtn.disabled = true;
    verifyBtn.innerHTML = '<span>VERIFYING...</span>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                otp: otp
            })
        });

        const data = await response.json();

        if (data.status === 'verified_successfully') {
            showNotification('Email verified successfully! Redirecting to login...', 'success');
            
            // Clear session storage
            sessionStorage.removeItem('pendingUsername');
            sessionStorage.removeItem('pendingEmail');
            
            setTimeout(() => {
                window.location.href = 'stunet.html';
            }, 2000);
        } else if (data.status === 'invalid_otp') {
            showError(otpError, 'Invalid OTP. Please try again.');
            otpInputs.forEach(input => input.value = '');
            otpInputs[0].focus();
            verifyBtn.disabled = false;
            verifyBtn.innerHTML = '<span>Verify OTP</span>';
        } else if (data.status === 'otp_expired') {
            showNotification('OTP expired. Please request a new one.', 'error');
            verifyBtn.disabled = false;
            verifyBtn.innerHTML = '<span>Verify OTP</span>';
        } else if (data.status === 'user_not_found') {
            showNotification('Session expired. Please sign up again.', 'error');
            setTimeout(() => {
                window.location.href = 'stunet-signup.html';
            }, 2000);
        } else {
            showNotification('Verification failed. Please try again.', 'error');
            verifyBtn.disabled = false;
            verifyBtn.innerHTML = '<span>Verify OTP</span>';
        }
    } catch (error) {
        console.error('Verification error:', error);
        showNotification('Connection error. Please check your internet.', 'error');
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = '<span>Verify OTP</span>';
    }
}

// ===== RESEND OTP =====
resendBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const username = sessionStorage.getItem('pendingUsername');
    
    if (!username) {
        showNotification('Session expired. Please sign up again.', 'error');
        return;
    }
    
    if (resendCount >= MAX_RESEND_ATTEMPTS) {
        showNotification('Maximum resend attempts reached. Please sign up again.', 'error');
        return;
    }
    
    resendBtn.disabled = true;
    resendBtn.textContent = 'Sending...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/resend-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username
            })
        });

        const data = await response.json();

        if (data.status === 'otp_resent') {
            showNotification('New OTP sent to your email!', 'success');
            resendCount++;
            otpInputs.forEach(input => input.value = '');
            otpInputs[0].focus();
            startTimer();
            
            // Update resend button text
            if (resendCount < MAX_RESEND_ATTEMPTS) {
                resendBtn.textContent = `Resend (${MAX_RESEND_ATTEMPTS - resendCount} left)`;
            } else {
                resendBtn.textContent = 'Max attempts reached';
            }
        } else {
            showNotification('Failed to resend OTP. Please try again.', 'error');
            resendBtn.disabled = false;
            resendBtn.textContent = 'Resend';
        }
    } catch (error) {
        console.error('Resend error:', error);
        showNotification('Connection error. Please try again.', 'error');
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend';
    }
}); 

// ===== ERROR DISPLAY =====
function showError(errorElement, message) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
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

    requestAnimationFrame(() => {
        notification.classList.add('show');
    });

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 350);
    }, 4000);
}

// ===== CHESS PIECES INTERACTIVE EFFECTS =====
const queenImage = document.querySelector('.queen-piece');
const kingImage = document.querySelector('.king-piece');
const rookImage = document.querySelector('.rook-piece');

if (queenImage && kingImage && rookImage) {
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX;
        
        if (x < window.innerWidth / 2) {
            const intensity = 0.3 + (Math.abs(x - window.innerWidth / 4) / (window.innerWidth / 4)) * 0.3;
            
            queenImage.style.filter = `drop-shadow(0 0 ${25 + intensity * 15}px rgba(240, 240, 240, ${0.15 + intensity * 0.15})) drop-shadow(0 0 ${50 + intensity * 25}px rgba(240, 240, 240, ${0.08 + intensity * 0.08}))`;
            
            rookImage.style.filter = `drop-shadow(0 0 ${30 + intensity * 20}px rgba(240, 240, 240, ${0.18 + intensity * 0.18})) drop-shadow(0 0 ${60 + intensity * 30}px rgba(240, 240, 240, ${0.09 + intensity * 0.09}))`;
            
            kingImage.style.filter = `drop-shadow(0 0 ${25 + intensity * 15}px rgba(240, 240, 240, ${0.15 + intensity * 0.15})) drop-shadow(0 0 ${50 + intensity * 25}px rgba(240, 240, 240, ${0.08 + intensity * 0.08}))`;
        }
    });

    document.addEventListener('mouseleave', () => {
        queenImage.style.filter = 'drop-shadow(0 0 25px rgba(240, 240, 240, 0.15)) drop-shadow(0 0 50px rgba(240, 240, 240, 0.08))';
        rookImage.style.filter = 'drop-shadow(0 0 30px rgba(240, 240, 240, 0.18)) drop-shadow(0 0 60px rgba(240, 240, 240, 0.09))';
        kingImage.style.filter = 'drop-shadow(0 0 25px rgba(240, 240, 240, 0.15)) drop-shadow(0 0 50px rgba(240, 240, 240, 0.08))';
    });
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    startTimer();
    otpInputs[0].focus();
});