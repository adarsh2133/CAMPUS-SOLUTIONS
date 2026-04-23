/**
 * api.js — STUNET Frontend API Layer  ✅ FIXED
 *
 * FIXES APPLIED:
 *  [BUG 1] initSignupPage: reads 'fullname', 'email-signup', 'password-signup' (actual HTML IDs)
 *  [BUG 2] initSettingsPage: fills 'settings-firstname'+'settings-lastname' (not settings-fullname)
 *  [BUG 4] initSignupPage: auto-generates username since signup form has no username field
 *  [BUG 5] redirectIfGuest: redirects to stunet.html (login), not stunet-hp-1.html (marketing)
 *  [BUG 6] autoInit: added teammates.html + achievements.html mappings
 *  [BUG 7] stunet-hp-1.html: mapped to no-op (it's a marketing page, not login)
 *          stunet.html: mapped to initLoginPage (actual login page)
 */

const API_BASE = 'http://localhost:5000/api';

// ─── Token / Session Helpers ──────────────────────────────────────────────────
const Auth = {
  getToken:    ()           => localStorage.getItem('stunet_token'),
  getUser:     ()           => JSON.parse(localStorage.getItem('stunet_user') || 'null'),
  setSession:  (token, user) => {
    localStorage.setItem('stunet_token', token);
    localStorage.setItem('stunet_user', JSON.stringify(user));
  },
  clearSession: () => {
    localStorage.removeItem('stunet_token');
    localStorage.removeItem('stunet_user');
  },
  isLoggedIn:      () => !!localStorage.getItem('stunet_token'),
  // FIX [BUG 7]: redirect to stunet.html (login page), NOT stunet-hp-1.html (marketing page)
  redirectIfGuest: () => {
    if (!localStorage.getItem('stunet_token')) {
      window.location.href = 'stunet.html';
    }
  },
};

// ─── Core Fetch Wrapper ───────────────────────────────────────────────────────
async function apiFetch(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = Auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    if (res.status === 401) {
      Auth.clearSession();
      window.location.href = 'stunet.html'; // FIX [BUG 7]
    }
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

// ─── Loading / Error UI Helpers ───────────────────────────────────────────────
function showLoading(containerId, message = 'Loading…') {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = `
    <div style="text-align:center;padding:48px 24px;color:var(--text3)">
      <i class="fa-solid fa-spinner fa-spin" style="font-size:28px;margin-bottom:12px;display:block;"></i>
      <p style="font-size:14px;">${message}</p>
    </div>`;
}

function showError(containerId, message = 'Something went wrong.') {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = `
    <div class="empty-state">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <p>${message}</p>
    </div>`;
}

function setTextContent(selector, value, fallback = '—') {
  const el = document.querySelector(selector);
  if (el) el.textContent = value ?? fallback;
}

// ─── Sidebar User Injection ───────────────────────────────────────────────────
function injectSidebarUser() {
  const user = Auth.getUser();
  if (!user) return;

  const initials = (user.fullName || user.username || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  document.querySelectorAll('.sidebar-user .avatar, .topbar .avatar')
    .forEach(el => el.textContent = initials);
  document.querySelectorAll('.sidebar-user-info .name')
    .forEach(el => el.textContent = user.fullName || user.username);
  document.querySelectorAll('.sidebar-user-info .role')
    .forEach(el => el.textContent = `${user.college || ''} · ${user.year || ''}`);

  const greeting = document.querySelector('.welcome-text h2');
  if (greeting) greeting.textContent = `Hey, ${(user.fullName || 'there').split(' ')[0]} 👋`;
}

// ─── AUTH API ─────────────────────────────────────────────────────────────────
const AuthAPI = {

  async login(email, password) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });
    Auth.setSession(data.data.token, data.data.user);
    return data.data;
  },

  async signup(payload) {
    const data = await apiFetch('/auth/signup', {
      method: 'POST',
      body: payload,
      auth: false,
    });
    sessionStorage.setItem('pending_email', payload.email);
    return data;
  },

  async verifyOtp(email, otp) {
    const data = await apiFetch('/auth/verify-otp', {
      method: 'POST',
      body: { email, otp },
      auth: false,
    });
    if (data.data?.token) Auth.setSession(data.data.token, data.data.user);
    return data;
  },

  async resendOtp(email) {
    return apiFetch('/auth/resend-otp', {
      method: 'POST',
      body: { email },
      auth: false,
    });
  },

  async me() {
    const data = await apiFetch('/auth/me');
    Auth.setSession(Auth.getToken(), data.data);
    return data.data;
  },

  logout() {
    apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    Auth.clearSession();
    window.location.href = 'stunet.html'; // FIX [BUG 7]
  },
};

// ─── LOGIN PAGE (stunet.html) ─────────────────────────────────────────────────
function initLoginPage() {
  if (Auth.isLoggedIn()) { window.location.href = 'index.html'; return; }

  const form    = document.getElementById('loginForm');
  const errEl   = document.getElementById('passwordError') || document.getElementById('loginError');
  const btnSpan = form?.querySelector('button[type=submit] span');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errEl) errEl.textContent = '';
    if (btnSpan) btnSpan.textContent = 'Signing in…';

    // stunet.html actual field IDs: #email and #password
    const email    = document.getElementById('email')?.value?.trim();
    const password = document.getElementById('password')?.value;

    try {
      await AuthAPI.login(email, password);
      window.location.href = 'index.html';
    } catch (err) {
      if (errEl) { errEl.textContent = err.message; errEl.style.display = 'block'; }
      if (btnSpan) btnSpan.textContent = 'Sign In';
    }
  });
}

// ─── SIGNUP PAGE (stunet-signup.html) ────────────────────────────────────────
function initSignupPage() {
  if (Auth.isLoggedIn()) { window.location.href = 'index.html'; return; }

  const form  = document.getElementById('signupForm');
  const errEl = document.getElementById('signupError');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errEl) errEl.textContent = '';

    // FIX [BUG 1]: actual IDs in stunet-signup.html:
    //   #fullname  (not fullName / full-name / name)
    //   #email-signup  (not #email)
    //   #password-signup  (not #password)
    const fullName  = document.getElementById('fullname')?.value?.trim() || '';
    const email     = document.getElementById('email-signup')?.value?.trim() || '';
    const password  = document.getElementById('password-signup')?.value || '';
    const confirmPw = document.getElementById('confirm-password')?.value || '';
    const terms     = document.getElementById('agreeTerms')?.checked;

    // Client-side validation
    if (!fullName) {
      if (errEl) { errEl.textContent = 'Please enter your full name.'; errEl.style.display = 'block'; }
      return;
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      if (errEl) { errEl.textContent = 'Please enter a valid email.'; errEl.style.display = 'block'; }
      return;
    }
    if (!password || password.length < 6) {
      if (errEl) { errEl.textContent = 'Password must be at least 6 characters.'; errEl.style.display = 'block'; }
      return;
    }
    if (password !== confirmPw) {
      if (errEl) { errEl.textContent = 'Passwords do not match.'; errEl.style.display = 'block'; }
      return;
    }
    if (!terms) {
      if (errEl) { errEl.textContent = 'Please agree to the Terms & Conditions.'; errEl.style.display = 'block'; }
      return;
    }

    // FIX [BUG 4]: signup form has no username field — auto-generate one
    const autoUsername = fullName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_' + Math.floor(1000 + Math.random() * 9000);

    const payload = { fullName, username: autoUsername, email, password };

    const btnSpan = form.querySelector('button[type=submit] span');
    if (btnSpan) btnSpan.textContent = 'Creating account…';

    try {
      await AuthAPI.signup(payload);
      window.location.href = 'stunet-otp.html';
    } catch (err) {
      if (errEl) { errEl.textContent = err.message; errEl.style.display = 'block'; }
      if (btnSpan) btnSpan.textContent = 'Create Account';
    }
  });
}

// ─── OTP PAGE (stunet-otp.html) ───────────────────────────────────────────────
function initOtpPage() {
  const form      = document.getElementById('otpForm');
  const errEl     = document.getElementById('otpError');
  const resendBtn = document.getElementById('resendBtn');
  const timerEl   = document.getElementById('timer');

  const email = sessionStorage.getItem('pending_email');
  if (!email) { window.location.href = 'stunet-signup.html'; return; }

  // Countdown (10 min)
  let seconds = 10 * 60;
  const countdown = setInterval(() => {
    seconds--;
    if (timerEl) {
      const m = String(Math.floor(seconds / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');
      timerEl.textContent = `${m}:${s}`;
    }
    if (seconds <= 0) { clearInterval(countdown); if (resendBtn) resendBtn.disabled = false; }
  }, 1000);

  // Auto-advance between the 6 OTP boxes
  const inputs = document.querySelectorAll('.otp-input');
  inputs.forEach((inp, i) => {
    inp.addEventListener('input', () => {
      inp.value = inp.value.replace(/\D/g, '').slice(-1);
      if (inp.value && i < inputs.length - 1) inputs[i + 1].focus();
    });
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !inp.value && i > 0) inputs[i - 1].focus();
    });
    inp.addEventListener('paste', (e) => {
      e.preventDefault();
      const digits = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
      digits.split('').forEach((d, j) => { if (inputs[j]) inputs[j].value = d; });
      (Array.from(inputs).find(el => !el.value) || inputs[5]).focus();
    });
  });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const otp = ['otp1','otp2','otp3','otp4','otp5','otp6']
        .map(id => document.getElementById(id)?.value || '').join('');

      if (otp.length !== 6) {
        if (errEl) { errEl.textContent = 'Please enter all 6 digits.'; errEl.style.display = 'block'; }
        return;
      }

      const btnSpan = form.querySelector('button[type=submit] span');
      if (btnSpan) btnSpan.textContent = 'Verifying…';

      try {
        await AuthAPI.verifyOtp(email, otp);
        clearInterval(countdown);
        sessionStorage.removeItem('pending_email');
        window.location.href = 'index.html';
      } catch (err) {
        if (errEl) { errEl.textContent = err.message; errEl.style.display = 'block'; }
        if (btnSpan) btnSpan.textContent = 'Verify OTP';
        inputs.forEach(inp => inp.value = '');
        inputs[0]?.focus();
      }
    });
  }

  if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
      try {
        await AuthAPI.resendOtp(email);
        resendBtn.disabled = true;
        seconds = 60;
        if (errEl) errEl.textContent = '';
        setTimeout(() => resendBtn.disabled = false, 60000);
      } catch (err) {
        if (errEl) { errEl.textContent = err.message; errEl.style.display = 'block'; }
      }
    });
  }
}

// ─── DASHBOARD (index.html) ───────────────────────────────────────────────────
async function initDashboardPage() {
  Auth.redirectIfGuest();
  injectSidebarUser();

  try {
    const compsData = await apiFetch('/competitions?limit=3&status=active', { auth: false });
    const compList  = document.getElementById('dash-comp-list');
    if (compList && compsData.data?.length) {
      compList.innerHTML = compsData.data.map(c => `
        <div class="comp-item">
          <div class="comp-top">
            <div>
              <div class="comp-name">${escapeHtml(c.name)}</div>
              <div class="comp-desc">${escapeHtml((c.description || '').slice(0, 80))}…</div>
            </div>
            <span class="comp-badge badge-new">Active</span>
          </div>
          <div class="comp-footer">
            <div class="comp-meta">
              ${c.prizePool ? `<span><b>${escapeHtml(c.prizePool)}</b> Prize</span>` : ''}
              ${c.registrationDeadline ? `<span>Closes <b>${new Date(c.registrationDeadline).toLocaleDateString()}</b></span>` : ''}
            </div>
            ${c.officialUrl ? `<a href="${escapeHtml(c.officialUrl)}" target="_blank" class="card-link">Register →</a>` : ''}
          </div>
        </div>`).join('');
    }

    const annData = await apiFetch('/announcements?limit=4', { auth: false });
    const actList = document.getElementById('dash-activity-list');
    if (actList && annData.data?.length) {
      actList.innerHTML = annData.data.map(a => `
        <div class="activity-item">
          <div class="act-icon" style="background:var(--accent-dim);color:var(--accent);">
            <i class="fa-solid fa-bullhorn"></i>
          </div>
          <div class="act-text">
            <p><b>${escapeHtml(a.title)}</b> — ${escapeHtml((a.body || '').slice(0, 100))}</p>
            <div class="time">${formatTimeAgo(a.createdAt)}</div>
          </div>
        </div>`).join('');
    }
  } catch (err) {
    console.error('Dashboard load error:', err.message);
  }
}

// ─── PROFILE PAGE (profile.html) ─────────────────────────────────────────────
async function initProfilePage() {
  Auth.redirectIfGuest();
  injectSidebarUser();

  try {
    const user = await AuthAPI.me();

    setTextContent('.profile-name', user.fullName);
    setTextContent('.profile-role', user.role || 'Student Developer');
    setTextContent('.profile-loc',  `${user.college || ''} · ${user.year || ''}`);
    setTextContent('.profile-bio',  user.bio || '');

    const initials = (user.fullName || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    document.querySelectorAll('.profile-avatar').forEach(el => el.textContent = initials);

    setTextContent('.p-stat:nth-child(1) .val', user.stats?.rating    || '—');
    setTextContent('.p-stat:nth-child(2) .val', user.stats?.projects   || '0');
    setTextContent('.p-stat:nth-child(3) .val', user.stats?.hackathons || '0');
  } catch (err) {
    console.error('Profile load error:', err.message);
  }
}

// ─── COMPETITIONS PAGE (competitions.html) ────────────────────────────────────
async function initCompetitionsPage() {
  Auth.redirectIfGuest();
  injectSidebarUser();

  const grid      = document.getElementById('comps-grid');
  const heroStats = document.getElementById('comp-hero-stats');
  if (grid) showLoading('comps-grid', 'Loading competitions…');

  try {
    const statsData = await apiFetch('/competitions/stats', { auth: false });
    if (heroStats && statsData.data) {
      const s = statsData.data;
      heroStats.innerHTML = `
        <div class="cstat"><div class="val">${s.active   || 0}</div><div class="lbl">Active</div></div>
        <div class="cstat"><div class="val">${s.total    || 0}</div><div class="lbl">Total</div></div>
        <div class="cstat"><div class="val">${s.upcoming || 0}</div><div class="lbl">Upcoming</div></div>`;
    }

    const data  = await apiFetch('/competitions?limit=20', { auth: false });
    const comps = data.data || [];
    if (!grid) return;
    if (!comps.length) { showError('comps-grid', 'No competitions found.'); return; }

    const categoryIcon = { Hackathon:'💻', Design:'🎨', AI:'🤖', Business:'💼', Coding:'🏆', Open:'🌐', Web3:'🔗', Pitch:'🎤' };
    const statusBadge  = {
      active:   `<span class="comp-badge badge-new">● Active</span>`,
      upcoming: `<span class="comp-badge badge-trend">Upcoming</span>`,
      ended:    `<span class="comp-badge" style="background:var(--surface3);color:var(--text3);">Ended</span>`,
    };

    grid.innerHTML = comps.map(c => `
      <div class="comp-card">
        <div class="comp-card-top">
          <div style="display:flex;gap:14px;align-items:flex-start;">
            <div class="comp-icon" style="background:var(--accent-dim);">${categoryIcon[c.category] || '🏆'}</div>
            <div>
              <div class="comp-card-title">${escapeHtml(c.name)}</div>
              <div class="comp-card-org">${escapeHtml(c.organiser || c.category || '')}</div>
            </div>
          </div>
          ${statusBadge[c.status] || ''}
        </div>
        <div class="comp-card-body">
          <div class="comp-card-desc">${escapeHtml(c.description || '')}</div>
          <div class="comp-meta-row">
            ${c.prizePool ? `<div class="comp-meta-item"><i class="fa-solid fa-trophy"></i> <b>${escapeHtml(c.prizePool)}</b></div>` : ''}
            ${c.registrationDeadline ? `<div class="comp-meta-item"><i class="fa-solid fa-calendar"></i> Deadline <b>${new Date(c.registrationDeadline).toLocaleDateString()}</b></div>` : ''}
            ${c.teamSizeMax ? `<div class="comp-meta-item"><i class="fa-solid fa-users"></i> Team ${c.teamSizeMin}–${c.teamSizeMax}</div>` : ''}
          </div>
        </div>
        <div class="comp-card-footer">
          ${c.officialUrl ? `<a href="${escapeHtml(c.officialUrl)}" target="_blank" class="btn-primary" style="padding:7px 16px;font-size:12px;text-decoration:none;">Register →</a>` : '<span></span>'}
          <span class="card-link" onclick="window.open('${escapeHtml(c.officialUrl || '#')}','_blank')">Details →</span>
        </div>
      </div>`).join('');

  } catch (err) {
    showError('comps-grid', `Failed to load: ${escapeHtml(err.message)}`);
  }
}

// ─── COMMUNITY PAGE (community.html) ─────────────────────────────────────────
async function initCommunityPage() {
  Auth.redirectIfGuest();
  injectSidebarUser();

  const feed = document.getElementById('community-feed');
  if (feed) showLoading('community-feed', 'Loading posts…');

  try {
    const data  = await apiFetch('/community?limit=15');
    const posts = data.data || [];

    if (!feed) return;
    if (!posts.length) { showError('community-feed', 'No posts yet. Be the first to share!'); return; }

    feed.innerHTML = posts.map(post => {
      const author   = post.author || {};
      const initials = (author.fullName || author.username || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      return `
        <div class="post-card" data-id="${post._id}">
          <div class="post-header">
            <div class="post-avatar">${initials}</div>
            <div class="post-meta">
              <div class="post-author">${escapeHtml(author.fullName || author.username || 'Anonymous')}</div>
              <div class="post-time">${escapeHtml(author.college || '')} · ${formatTimeAgo(post.createdAt)}</div>
            </div>
            ${post.visibility === 'pinned' ? '<span class="comp-badge badge-featured">📌 Pinned</span>' : ''}
          </div>
          <div class="post-body"><p>${escapeHtml(post.content || '')}</p></div>
          <div class="post-footer">
            <span class="post-action" onclick="likePost('${post._id}',this)" style="cursor:pointer;">
              <i class="fa-regular fa-heart"></i> ${post.likes || 0}
            </span>
            <span class="post-action"><i class="fa-regular fa-comment"></i> ${post.comments?.length || 0}</span>
            ${post.forum ? `<span class="comp-badge" style="font-size:10px;">${escapeHtml(post.forum)}</span>` : ''}
          </div>
        </div>`;
    }).join('');

  } catch (err) {
    showError('community-feed', `Failed to load: ${escapeHtml(err.message)}`);
  }

  // Compose box
  const composeBtn   = document.querySelector('.compose-btn, .post-compose .btn-primary');
  const composeInput = document.querySelector('.compose-input, .post-compose textarea');
  if (composeBtn && composeInput) {
    composeBtn.addEventListener('click', async () => {
      const content = composeInput.value.trim();
      if (!content) return;
      const orig = composeBtn.textContent;
      composeBtn.textContent = 'Posting…';
      try {
        await apiFetch('/community', { method: 'POST', body: { content } });
        composeInput.value = '';
        composeBtn.textContent = orig;
        initCommunityPage();
      } catch (err) {
        composeBtn.textContent = orig;
        alert(err.message);
      }
    });
  }
}

async function likePost(postId, el) {
  try {
    const data = await apiFetch(`/community/${postId}/like`, { method: 'POST' });
    if (el) el.innerHTML = `<i class="fa-${data.data.liked ? 'solid' : 'regular'} fa-heart" style="color:${data.data.liked ? '#f06bae' : ''}"></i> ${data.data.likes}`;
  } catch (err) { console.error(err.message); }
}

// ─── TEAMMATES PAGE (teammates.html) ─────────────────────────────────────────
// FIX [BUG 6]: this function was missing entirely
async function initTeammatesPage() {
  Auth.redirectIfGuest();
  injectSidebarUser();

  // Try multiple possible grid container IDs/classes
  const grid = document.getElementById('students-grid')  ||
               document.getElementById('teammates-grid') ||
               document.querySelector('.students-grid')  ||
               document.querySelector('.teammates-grid');

  if (grid) {
    if (!grid.id) grid.id = 'teammates-grid';
    showLoading(grid.id, 'Finding teammates…');
  }

  try {
    const data  = await apiFetch('/users?limit=20');
    const users = data.data || [];

    if (!grid) return;
    if (!users.length) { showError(grid.id || 'teammates-grid', 'No teammates found yet.'); return; }

    grid.innerHTML = users.map(u => {
      const initials = (u.fullName || u.username || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      const skills   = (u.skills || []).slice(0, 4);
      return `
        <div class="student-card">
          <div class="sc-top">
            <div class="sc-avatar" style="background:linear-gradient(135deg,var(--accent),#4fd1c5);">${initials}</div>
            <div class="sc-info">
              <div class="sc-name">${escapeHtml(u.fullName || u.username)}</div>
              <div class="sc-role">${escapeHtml(u.role || 'Student Developer')}</div>
              <div class="sc-college">${escapeHtml(u.college || '')}${u.year ? ' · ' + u.year : ''}</div>
            </div>
            <div class="sc-rating">${u.stats?.rating ? Number(u.stats.rating).toFixed(1) : '—'}</div>
          </div>
          ${skills.length ? `<div class="tags">${skills.map(s => `<span class="tag">${escapeHtml(s)}</span>`).join('')}</div>` : ''}
          <div class="sc-actions" style="display:flex;gap:8px;margin-top:12px;">
            <button class="btn-primary" style="flex:1;padding:7px 12px;font-size:12px;" onclick="this.textContent='Requested';this.disabled=true;">
              <i class="fa-solid fa-user-plus"></i> Connect
            </button>
            <button class="btn-outline" style="padding:7px 14px;font-size:12px;" onclick="window.location.href='profile.html?user=${escapeHtml(u.username)}'">
              Profile
            </button>
          </div>
        </div>`;
    }).join('');

  } catch (err) {
    if (grid) showError(grid.id || 'teammates-grid', `Failed to load: ${escapeHtml(err.message)}`);
  }
}

// ─── ACHIEVEMENTS PAGE (achievements.html) ───────────────────────────────────
// FIX [BUG 6]: this function was missing entirely
async function initAchievementsPage() {
  Auth.redirectIfGuest();
  injectSidebarUser();

  try {
    const user = await AuthAPI.me();

    // Update hero stat values — try common selector patterns
    const statVals = document.querySelectorAll('.ah-stat .val, .stat-card .val, .achievement-stat .val');
    if (statVals[0]) statVals[0].textContent = user.stats?.points     || '0';
    if (statVals[1]) statVals[1].textContent = user.stats?.hackathons || '0';
    if (statVals[2]) statVals[2].textContent = user.stats?.projects   || '0';
    if (statVals[3]) statVals[3].textContent = user.stats?.rating     || '—';

    // Leaderboard
    const lbWrap = document.querySelector('.rank-list, .leaderboard-list, #leaderboard');
    if (lbWrap) {
      const lbData = await apiFetch('/users/leaderboard', { auth: false });
      const top    = lbData.data || [];
      const me     = Auth.getUser();

      lbWrap.innerHTML = top.slice(0, 10).map((u, i) => {
        const isYou    = u._id === me?._id;
        const initials = (u.fullName || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        const medal    = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        return `
          <div class="rank-item${isYou ? ' you-row' : ''}" style="${isYou ? 'background:var(--accent-dim);border:1px solid var(--accent-border);' : ''}border-radius:8px;padding:10px 14px;display:flex;align-items:center;gap:12px;margin-bottom:6px;">
            <div class="rank-medal" style="width:28px;text-align:center;font-size:15px;">${medal}</div>
            <div class="rank-avatar" style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#4fd1c5);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#0a0a0f;">${initials}</div>
            <div class="rank-name" style="flex:1;font-size:13px;font-weight:${isYou ? '700' : '500'};">
              ${escapeHtml(u.fullName || u.username)} ${isYou ? '<span style="color:var(--accent);font-size:10px;">(You)</span>' : ''}
            </div>
            <div class="rank-pts" style="font-family:\'Syne\',sans-serif;font-weight:800;color:var(--accent);font-size:14px;">${u.stats?.points || 0}</div>
          </div>`;
      }).join('');
    }
  } catch (err) {
    console.error('Achievements load error:', err.message);
  }
}

// ─── SETTINGS PAGE (settings.html) ───────────────────────────────────────────
async function initSettingsPage() {
  Auth.redirectIfGuest();
  injectSidebarUser();

  try {
    const user = await AuthAPI.me();

    const fill = (id, val) => { const el = document.getElementById(id); if (el && val != null) el.value = val; };

    // FIX [BUG 2]: settings.html has 'settings-firstname' + 'settings-lastname', NOT 'settings-fullname'
    const nameParts = (user.fullName || '').split(' ');
    fill('settings-firstname', nameParts[0] || '');
    fill('settings-lastname',  nameParts.slice(1).join(' ') || '');
    // Also fill single-field variants in case they exist
    fill('settings-fullname', user.fullName);
    fill('settings-username', user.username);
    fill('settings-email',    user.email);
    fill('settings-college',  user.college);
    fill('settings-year',     user.year);
    fill('settings-bio',      user.bio);
    fill('settings-skills',   Array.isArray(user.skills) ? user.skills.join(', ') : (user.skills || ''));

    // Avatar initials
    const av = document.getElementById('settings-avatar');
    if (av) av.textContent = (user.fullName || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  } catch (err) {
    console.error('Settings load error:', err.message);
  }

  // Save profile
  const saveBtn = document.querySelector('.save-bar .btn-primary, #save-profile-btn, .settings-save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      // FIX [BUG 2]: read from actual field IDs
      const firstName = document.getElementById('settings-firstname')?.value?.trim() || '';
      const lastName  = document.getElementById('settings-lastname')?.value?.trim()  || '';
      const fullName  = document.getElementById('settings-fullname')?.value?.trim()  || `${firstName} ${lastName}`.trim();

      const rawYear = document.getElementById('settings-year')?.value?.trim() || '';
      // FIX [BUG 3]: map free-text year to enum values accepted by backend
      const yearMap = { '1': '1st Year', '2': '2nd Year', '3': '3rd Year', '4': '4th Year' };
      const year    = yearMap[rawYear] || ['1st Year','2nd Year','3rd Year','4th Year','Postgrad','Alumni',''].includes(rawYear) ? rawYear : '';

      const updates = {
        fullName,
        college: document.getElementById('settings-college')?.value?.trim(),
        year,
        bio:    document.getElementById('settings-bio')?.value?.trim(),
        skills: document.getElementById('settings-skills')?.value?.trim(),
      };

      const orig = saveBtn.textContent;
      saveBtn.textContent = 'Saving…';
      try {
        await apiFetch('/auth/update-profile', { method: 'PUT', body: updates });
        await AuthAPI.me();
        saveBtn.textContent = '✓ Saved!';
        setTimeout(() => saveBtn.textContent = orig, 2000);
      } catch (err) {
        alert('Save failed: ' + err.message);
        saveBtn.textContent = orig;
      }
    });
  }

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => AuthAPI.logout());
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs  < 24) return `${hrs}h ago`;
  if (days < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Auto-init ────────────────────────────────────────────────────────────────
(function autoInit() {
  const page = window.location.pathname.split('/').pop() || 'index.html';

  const map = {
    // FIX [BUG 7]: stunet.html = login, stunet-hp-1.html = marketing (no init needed)
    'stunet.html':        initLoginPage,
    'stunet-hp-1.html':   () => {},            // marketing page — no auth required
    'stunet-signup.html': initSignupPage,
    'stunet-otp.html':    initOtpPage,
    'index.html':         initDashboardPage,
    'profile.html':       initProfilePage,
    'competitions.html':  initCompetitionsPage,
    'community.html':     initCommunityPage,
    // FIX [BUG 6]: these two were missing
    'teammates.html':     initTeammatesPage,
    'achievements.html':  initAchievementsPage,
    'settings.html':      initSettingsPage,
  };

  const fn = map[page];
  if (fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
})();