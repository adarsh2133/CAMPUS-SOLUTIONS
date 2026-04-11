// ===== DOM ELEMENTS =====
const signupForm = document.getElementById("signupForm");
const fullnameInput = document.getElementById("fullname");
const emailInput = document.getElementById("email-signup");
const passwordInput = document.getElementById("password-signup");
const confirmPasswordInput = document.getElementById("confirm-password");
const passwordToggleSignup = document.getElementById("passwordToggleSignup");
const confirmPasswordToggle = document.getElementById("confirmPasswordToggle");
const agreeTerms = document.getElementById("agreeTerms");

const fullnameError = document.getElementById("fullnameError");
const emailSignupError = document.getElementById("emailSignupError");
const passwordSignupError = document.getElementById("passwordSignupError");
const confirmPasswordError = document.getElementById("confirmPasswordError");

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

function clearError(errorElement) {
  errorElement.textContent = "";
  errorElement.style.display = "none";
}

function showError(errorElement, message) {
  errorElement.textContent = message;
  errorElement.style.display = "block";
}

// ===== PASSWORD VISIBILITY =====
passwordToggleSignup.addEventListener("click", () => {
  passwordInput.type = passwordInput.type === "password" ? "text" : "password";
});

confirmPasswordToggle.addEventListener("click", () => {
  confirmPasswordInput.type =
    confirmPasswordInput.type === "password" ? "text" : "password";
});

// ===== FORM SUBMISSION =====
let isSubmitting = false;

signupForm.addEventListener("submit", async (e) => {
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

  if (!validateFullName(fullname)) {
    showError(fullnameError, "Full name must be at least 2 characters");
    isValid = false;
  }

  if (!validateEmail(email)) {
    showError(emailSignupError, "Invalid email");
    isValid = false;
  }

  if (!validatePassword(password)) {
    showError(passwordSignupError, "Password must be 8 characters");
    isValid = false;
  }

  if (password !== confirmPassword) {
    showError(confirmPasswordError, "Passwords do not match");
    isValid = false;
  }

  if (!agreeTerms.checked) {
    showNotification("Please agree to Terms", "error");
    isValid = false;
  }

  if (!isValid) return;

  await handleSignup(fullname, email, password);
});

// ===== BACKEND API CALL =====
async function handleSignup(fullname, email, password) {
  const signupBtn = document.querySelector(".btn-login");
  const originalText = signupBtn.innerHTML;

  try {
    isSubmitting = true;

    signupBtn.disabled = true;
    signupBtn.innerHTML = "<span>CREATING ACCOUNT...</span>";

    const response = await fetch("http://localhost:3000/auth/register", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        username: email,
        password: password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      showNotification("Account created successfully!", "success");

      localStorage.setItem(
        "stunet_user",
        JSON.stringify({
          fullname,
          email,
        }),
      );

      setTimeout(() => {
        window.location.href = "stunet.html";
      }, 1500);
    } else {
      showNotification(data.message || "Signup failed", "error");
    }
  } catch (error) {
    console.error(error);

    showNotification("Server connection failed", "error");
  }

  signupBtn.disabled = false;
  signupBtn.innerHTML = originalText;

  isSubmitting = false;
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = "info") {
  const notification = document.createElement("div");

  notification.className = `notification notification-${type}`;

  notification.innerHTML = `<span>${message}</span>`;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 4000);
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  fullnameInput.focus();
});
