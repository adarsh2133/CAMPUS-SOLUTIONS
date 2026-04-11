const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const passwordToggle = document.getElementById("passwordToggle");
const rememberMe = document.getElementById("rememberMe");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");

// ===== VALIDATION FUNCTIONS =====
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function validatePassword(password) {
  return password.trim().length >= 6;
}

function clearError(errorElement) {
  errorElement.textContent = "";
  errorElement.style.display = "none";
}

function showError(errorElement, message) {
  errorElement.textContent = message;
  errorElement.style.display = "block";
}

// ===== PASSWORD TOGGLE =====
passwordToggle.addEventListener("click", (e) => {
  e.preventDefault();

  const visible = passwordInput.type === "text";

  passwordInput.type = visible ? "password" : "text";

  passwordToggle.innerHTML = visible
    ? '<i class="fas fa-eye"></i>'
    : '<i class="fas fa-eye-slash"></i>';
});

// ===== FORM SUBMISSION =====
let isSubmitting = false;

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (isSubmitting) return;

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  let isValid = true;

  clearError(emailError);
  clearError(passwordError);

  if (!validateEmail(email)) {
    showError(emailError, "Invalid email address");
    isValid = false;
  }

  if (!validatePassword(password)) {
    showError(passwordError, "Password must be at least 6 characters");
    isValid = false;
  }

  if (!isValid) return;

  await handleLogin(email, password);
});

// ===== LOGIN HANDLER =====
async function handleLogin(email, password) {
  const loginBtn = document.querySelector(".btn-login");
  const originalText = loginBtn.innerHTML;

  try {
    isSubmitting = true;

    loginBtn.disabled = true;
    loginBtn.innerHTML = "<span>SIGNING IN...</span>";

    const response = await fetch("http://localhost:3000/auth/login", {
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
      if (rememberMe.checked) {
        localStorage.setItem("stunet_email", email);
        localStorage.setItem("stunet_remember", "true");
      }

      localStorage.setItem("stunet_token", data.token || "");

      showNotification("Login successful! Redirecting...", "success");

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1500);
    } else {
      showNotification(data.message || "Login failed", "error");
    }
  } catch (error) {
    console.error("Login error:", error);

    showNotification("Server connection failed", "error");
  }

  loginBtn.disabled = false;
  loginBtn.innerHTML = originalText;

  isSubmitting = false;
}

// ===== NOTIFICATION =====
function showNotification(message, type = "info") {
  const notification = document.createElement("div");

  notification.className = `notification notification-${type}`;

  notification.innerHTML = `<span>${message}</span>`;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 4000);
}

// ===== REMEMBER EMAIL =====
function loadRememberedEmail() {
  if (localStorage.getItem("stunet_remember") === "true") {
    const email = localStorage.getItem("stunet_email");

    if (email) {
      emailInput.value = email;
      rememberMe.checked = true;
    }
  }
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  loadRememberedEmail();

  emailInput.focus();
});
