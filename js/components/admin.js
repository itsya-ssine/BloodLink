// =========================================
// BloodLink — Admin Dashboard Component
// =========================================

const AdminDashboardComponent = {
  state: {
    loading: false,
    error: '',
    users: [],
  },

  render() {
    const u = AppData.currentUser;

    if (!u) {
      return `
        <div class="page-enter">
          <div class="card fade-up" style="max-width:720px;margin:72px auto;padding:32px;text-align:center">
            <div style="font-size:3rem;margin-bottom:12px"><i class="bi bi-shield-lock-fill" aria-hidden="true"></i></div>
            <h1 class="page-title" style="margin-bottom:10px">Admin <span>Dashboard</span></h1>
            <p class="page-subtitle">Sign in as an administrator to view this page.</p>
          </div>
        </div>
      `;
    }

    if (u.role !== 'admin') {
      return `
        <div class="page-enter">
          <div class="card fade-up" style="max-width:720px;margin:72px auto;padding:32px;text-align:center">
            <div style="font-size:3rem;margin-bottom:12px;color:var(--crimson-light)"><i class="bi bi-shield-exclamation" aria-hidden="true"></i></div>
            <h1 class="page-title" style="margin-bottom:10px">Access <span>Denied</span></h1>
            <p class="page-subtitle">This area is restricted to BloodLink administrators.</p>
          </div>
        </div>
      `;
    }

    const stats = this.buildStats();
    const users = this.state.users.map(row => this.mapUser(row));

    return `
      <div class="page-enter">
        <div class="page-header fade-up">
          <h1 class="page-title">Admin <span>Dashboard</span></h1>
          <p class="page-subtitle">Monitor accounts, verification status, and platform activity from the same BloodLink interface.</p>
        </div>

        <div class="grid-4 fade-up delay-1" style="margin-bottom:24px">
          <div class="stat-card">
            <div class="stat-icon"><i class="bi bi-people-fill" aria-hidden="true"></i></div>
            <div class="stat-label">Total Users</div>
            <div class="stat-value">${stats.totalUsers.toLocaleString()}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><i class="bi bi-shield-lock-fill" aria-hidden="true"></i></div>
            <div class="stat-label">Admin Accounts</div>
            <div class="stat-value crimson">${stats.adminUsers.toLocaleString()}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><i class="bi bi-envelope-check-fill" aria-hidden="true"></i></div>
            <div class="stat-label">Verified Users</div>
            <div class="stat-value green">${stats.verifiedUsers.toLocaleString()}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><i class="bi bi-database-fill-check" aria-hidden="true"></i></div>
            <div class="stat-label">Live Donor Base</div>
            <div class="stat-value">${(AppData.globalStats?.totalDonors || 0).toLocaleString()}</div>
          </div>
        </div>

        <div class="grid-2 fade-up delay-2">
          <div class="card">
            <div class="card-header">
              <span class="card-title"><i class="bi bi-graph-up" aria-hidden="true"></i> Platform Overview</span>
              <button class="btn btn-ghost btn-sm" onclick="AdminDashboardComponent.refresh()">Refresh</button>
            </div>
            <div style="display:grid;gap:12px">
              ${this.infoRow('Donations this month', (AppData.globalStats?.donationsThisMonth || 0).toLocaleString())}
              ${this.infoRow('Lives this year', (AppData.globalStats?.livesThisYear || 0).toLocaleString())}
              ${this.infoRow('Partner hospitals', (AppData.globalStats?.hospitalsNetwork || 0).toLocaleString())}
              ${this.infoRow('Admin account', u.fullName)}
              ${this.infoRow('Admin email', u.email)}
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <span class="card-title"><i class="bi bi-lightning-charge-fill" aria-hidden="true"></i> Quick Actions</span>
              <span class="badge badge-blue"><i class="bi bi-shield-check" aria-hidden="true"></i> Secure</span>
            </div>
            <div style="display:grid;gap:12px">
              <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="App.navigate('requests')">
                <i class="bi bi-megaphone-fill" aria-hidden="true"></i> Review Requests
              </button>
              <button class="btn btn-secondary" style="width:100%;justify-content:center" onclick="App.navigate('hospitals')">
                <i class="bi bi-hospital-fill" aria-hidden="true"></i> Open Hospitals Map
              </button>
              <button class="btn btn-ghost" style="width:100%;justify-content:center" onclick="AdminDashboardComponent.refresh()">
                <i class="bi bi-arrow-repeat" aria-hidden="true"></i> Reload User Directory
              </button>
            </div>
          </div>
        </div>

        <div class="card fade-up delay-3" style="margin-top:20px">
          <div class="card-header">
            <span class="card-title"><i class="bi bi-person-lines-fill" aria-hidden="true"></i> User Directory</span>
            <span class="badge badge-amber">${this.state.loading ? 'Loading' : `${stats.activeUsers.toLocaleString()} active`}</span>
          </div>

          ${this.state.error ? `
            <div class="alert alert-urgent" style="margin-bottom:18px">
              <div class="alert-icon"><i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i></div>
              <div>
                <div class="alert-title">Could not load users</div>
                <div class="alert-desc">${this.state.error}</div>
              </div>
            </div>
          ` : ''}

          <div class="table-wrap" style="border:none">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                ${this.renderUserRows(users)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  buildStats() {
    const users = this.state.users.map(row => this.mapUser(row));
    return {
      totalUsers: users.length,
      adminUsers: users.filter(user => user.role === 'admin').length,
      verifiedUsers: users.filter(user => user.emailVerified).length,
      activeUsers: users.filter(user => !user.deletedAt).length,
    };
  },

  mapUser(row) {
    const firstName = row.first_name || '';
    const lastName = row.last_name || '';

    return {
      id: Number(row.id),
      fullName: `${firstName} ${lastName}`.trim() || 'Unknown user',
      email: row.email || '',
      role: row.role || 'user',
      emailVerified: Boolean(row.email_verified_at),
      lastLoginAt: row.last_login_at || null,
      createdAt: row.created_at || null,
      deletedAt: row.deleted_at || null,
    };
  },

  renderUserRows(users) {
    if (this.state.loading && users.length === 0) {
      return `
        <tr>
          <td colspan="6" style="padding:24px;color:var(--text-muted)">Loading user directory...</td>
        </tr>
      `;
    }

    if (!users.length) {
      return `
        <tr>
          <td colspan="6" style="padding:24px;color:var(--text-muted)">No users available.</td>
        </tr>
      `;
    }

    return users.map(user => `
      <tr>
        <td>
          <div style="display:flex;flex-direction:column;gap:4px">
            <span style="font-weight:600;color:var(--text-primary)">${user.fullName}</span>
            <span style="font-size:0.78rem;color:var(--text-muted)">ID ${user.id}</span>
          </div>
        </td>
        <td>${user.email}</td>
        <td><span class="badge ${user.role === 'admin' ? 'badge-red' : 'badge-blue'}">${user.role}</span></td>
        <td>
          ${user.deletedAt
            ? '<span class="badge badge-red">Deleted</span>'
            : user.emailVerified
              ? '<span class="badge badge-green">Verified</span>'
              : '<span class="badge badge-amber">Pending</span>'}
        </td>
        <td style="font-size:0.85rem;color:var(--text-secondary)">${user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('en-GB') : 'Never'}</td>
        <td style="font-size:0.85rem;color:var(--text-secondary)">${user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB') : 'Unknown'}</td>
      </tr>
    `).join('');
  },

  infoRow(label, value) {
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);">
        <span style="font-size:0.8rem;color:var(--text-muted);font-weight:500;">${label}</span>
        <span style="font-size:0.875rem;color:var(--text-primary);font-weight:500;text-align:right;max-width:60%;">${value}</span>
      </div>
    `;
  },

  async refresh() {
    await this.init();
  },

  async init() {
    const u = AppData.currentUser;
    if (!u || u.role !== 'admin') return;

    this.state.loading = true;
    this.state.error = '';
    this.state.users = [];

    if (App.currentPage === 'admin') {
      document.getElementById('mainContent').innerHTML = this.render();
    }

    try {
      this.state.users = await BloodLinkApi.getAdminUsers();
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load admin data';
    } finally {
      this.state.loading = false;
      if (App.currentPage === 'admin') {
        document.getElementById('mainContent').innerHTML = this.render();
      }
    }
  },
};

window.AdminDashboardComponent = AdminDashboardComponent;