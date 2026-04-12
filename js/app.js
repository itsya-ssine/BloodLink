// =========================================
// BloodLink — Main Application
// =========================================

window.AppData = window.AppData || {};
var AppData = window.AppData;

const App = {

  currentPage: 'dashboard',
  currentFilter: 'all',
  theme: 'dark',
  authenticated: false,

  async init() {
    this.initTheme();

    // Set up navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        this.navigate(page);
        // Close mobile sidebar
        document.getElementById('sidebar').classList.remove('open');
      });
    });

    // Mobile menu toggle
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
      });
    }

    // Close sidebar on overlay click
    document.addEventListener('click', (e) => {
      const sidebar = document.getElementById('sidebar');
      const menuBtn = document.getElementById('menuBtn');
      if (
        window.innerWidth <= 900 &&
        sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        !menuBtn.contains(e.target)
      ) {
        sidebar.classList.remove('open');
      }
    });

    // Close modals on overlay click
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('open');
      }
    });

    // Keyboard accessibility
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
        document.getElementById('sidebar').classList.remove('open');
      }
    });

    // Load backend data before first render
    try {
      const authState = await BloodLinkApi.bootstrapAuth();
      BloodLinkApi.setCsrfToken(authState.csrf_token);

      if (!authState.authenticated) {
        this.renderAuthScreen('login');
        return;
      }

      await this.bootstrapData(authState);
    } catch (err) {
      console.error('Backend bootstrap failed', err);
      this.renderBackendError(err instanceof Error ? err.message : 'Unable to load data from backend');
      return;
    }

    // Update sidebar user info
    this.updateSidebarUser();

    // Navigate to dashboard
    this.navigate('dashboard');
  },

  async bootstrapData(authState = null) {
    if (!window.BloodLinkApi) {
      throw new Error('API client is not available');
    }

    const data = await window.BloodLinkApi.getInitialData(authState);
    if (!data.authenticated) {
      this.renderAuthScreen('login');
      return;
    }

    const required = ['currentUser', 'hospitals', 'donations', 'requests', 'achievements', 'bloodTypes', 'globalStats'];
    const missing = required.filter(key => !(key in data));
    if (missing.length > 0) {
      throw new Error(`Incomplete backend payload: ${missing.join(', ')}`);
    }

    Object.keys(window.AppData).forEach(key => delete window.AppData[key]);
    Object.assign(window.AppData, data);
    this.authenticated = true;
    document.body.classList.remove('auth-mode');
  },

  async loadApp() {
    const data = await window.BloodLinkApi.getInitialData();
    if (!data.authenticated) {
      this.renderAuthScreen('login');
      return;
    }

    Object.keys(window.AppData).forEach(key => delete window.AppData[key]);
    Object.assign(window.AppData, data);
    this.authenticated = true;
    document.body.classList.remove('auth-mode');
    this.updateSidebarUser();
    this.navigate('dashboard');
  },

  renderAuthScreen(view = 'login', message = '') {
    this.authenticated = false;
    document.body.classList.add('auth-mode');
    const main = document.getElementById('mainContent');
    if (!main || !window.AuthComponent) return;

    main.innerHTML = window.AuthComponent.render(view, message);
    window.AuthComponent.bind(view);
  },

  renderBackendError(message) {
    const main = document.getElementById('mainContent');
    if (!main) return;

    main.innerHTML = `
      <div class="card" style="max-width:720px;margin:80px auto;padding:32px">
        <div class="card-header" style="margin-bottom:12px">
          <span class="card-title"><i class="bi bi-database-exclamation" aria-hidden="true"></i> Backend Required</span>
        </div>
        <p style="color:var(--text-secondary);margin-bottom:10px">The app is configured to use PostgreSQL data only. It will not fall back to mock data.</p>
        <p style="color:var(--text-muted);font-size:0.85rem">${message}</p>
      </div>
    `;
  },

  initTheme() {
    const storedTheme = localStorage.getItem('bloodlink-theme');
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const initialTheme = storedTheme || (prefersLight ? 'light' : 'dark');

    this.applyTheme(initialTheme);

    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.addEventListener('click', () => this.toggleTheme());
    });
  },

  applyTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bloodlink-theme', theme);
    this.syncThemeToggleUI();
  },

  toggleTheme() {
    this.applyTheme(this.theme === 'dark' ? 'light' : 'dark');
  },

  syncThemeToggleUI() {
    const switchTo = this.theme === 'dark' ? 'light' : 'dark';
    const iconClass = switchTo === 'light' ? 'bi-sun-fill' : 'bi-moon-stars-fill';

    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      const iconEl = btn.querySelector('.theme-icon');

      if (iconEl) {
        iconEl.className = `bi ${iconClass} theme-icon`;
      }

      btn.setAttribute('aria-label', `Switch to ${switchTo} mode`);
      btn.setAttribute('title', `Switch to ${switchTo} mode`);
    });
  },

  navigate(page) {
    this.currentPage = page;
    Router.navigate(page);
  },

  updateSidebarUser() {
    const u = AppData.currentUser;
    if (!u) return;
    const nameEl   = document.getElementById('sidebarName');
    const avatarEl = document.getElementById('sidebarAvatar');
    const bloodEl  = document.getElementById('sidebarBlood');
    const mobileEl = document.getElementById('mobileAvatar');

    if (nameEl)   nameEl.textContent   = u.fullName;
    if (avatarEl) avatarEl.textContent = u.initials;
    if (bloodEl)  bloodEl.textContent  = u.bloodType;
    if (mobileEl) mobileEl.textContent = u.initials;
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer') || this.createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
      success: 'bi-check-circle-fill',
      error: 'bi-x-circle-fill',
      info: 'bi-info-circle-fill',
    };
    toast.innerHTML = `
      <i class="bi ${icons[type] || 'bi-dot'}" style="font-size:1.1rem" aria-hidden="true"></i>
      <span style="font-size:0.875rem">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  createToastContainer() {
    const div = document.createElement('div');
    div.id = 'toastContainer';
    div.className = 'toast-container';
    document.body.appendChild(div);
    return div;
  },
};

window.App = App;

// ---- BOOT ----
document.addEventListener('DOMContentLoaded', async () => {
  await App.init();
});
