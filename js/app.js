// =========================================
// BloodLink — Main Application
// =========================================

const App = {

  currentPage: 'dashboard',
  currentFilter: 'all',

  init() {
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

    // Update sidebar user info
    this.updateSidebarUser();

    // Navigate to dashboard
    this.navigate('dashboard');
  },

  navigate(page) {
    this.currentPage = page;
    Router.navigate(page);
  },

  updateSidebarUser() {
    const u = AppData.currentUser;
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

    const icons = { success: '✓', error: '✗', info: 'ℹ' };
    toast.innerHTML = `
      <span style="font-size:1.1rem">${icons[type] || '•'}</span>
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

// ---- BOOT ----
document.addEventListener('DOMContentLoaded', () => App.init());
