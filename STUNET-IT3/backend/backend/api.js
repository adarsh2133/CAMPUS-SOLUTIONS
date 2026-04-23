/**
 * STUNET API Client
 * Shared across stunet.html (login) and stunet-signup.html (signup + OTP)
 * Drop this file into the root of the project, replacing the existing api.js
 */

const API_BASE = 'http://localhost:5000/api';   // ← change to your server URL in production

// ─── Token helpers ────────────────────────────────────────────────────────────
const Auth = {
  setTokens(accessToken, refreshToken, user) {
    localStorage.setItem('stunet_token',         accessToken);
    localStorage.setItem('stunet_refresh_token', refreshToken);
    localStorage.setItem('stunet_user',          JSON.stringify(user));
  },
  getToken()        { return localStorage.getItem('stunet_token'); },
  getRefreshToken() { return localStorage.getItem('stunet_refresh_token'); },
  getUser()         {
    try { return JSON.parse(localStorage.getItem('stunet_user')); }
    catch { return null; }
  },
  clear() {
    localStorage.removeItem('stunet_token');
    localStorage.removeItem('stunet_refresh_token');
    localStorage.removeItem('stunet_user');
  },
  isLoggedIn() { return !!this.getToken(); }
};

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = Auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data   = data;
    throw err;
  }
  return data;
}

// ─── Auth API ────────────────────────────────────────────────────────────────
const AuthAPI = {
  /** POST /api/auth/signup */
  signup(fullName, email, password) {
    return apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password }),
    });
  },

  /** POST /api/auth/verify-otp */
  verifyOTP(email, otp) {
    return apiFetch('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  /** POST /api/auth/resend-otp */
  resendOTP(email) {
    return apiFetch('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email, purpose: 'email_verify' }),
    });
  },

  /** POST /api/auth/login */
  async login(email, password) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    Auth.setTokens(data.token, data.refreshToken, data.user);
    return data;
  },

  /** POST /api/auth/logout */
  async logout() {
    try { await apiFetch('/auth/logout', { method: 'POST' }); } catch (_) {}
    Auth.clear();
    window.location.href = 'stunet.html';
  },

  /** POST /api/auth/forgot-password */
  forgotPassword(email) {
    return apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /** POST /api/auth/reset-password */
  resetPassword(email, otp, newPassword) {
    return apiFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    });
  },
};

// ─── Redirect if already logged in ───────────────────────────────────────────
(function guardAuthPages() {
  const authPages = ['stunet.html', 'stunet-signup.html', 'stunet-otp.html'];
  const current   = window.location.pathname.split('/').pop();
  if (authPages.includes(current) && Auth.isLoggedIn()) {
    window.location.href = 'index.html';   // or your dashboard page
  }
})();

// Make available globally
window.AuthAPI = AuthAPI;
window.Auth    = Auth;