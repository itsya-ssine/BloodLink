// =========================================
// BloodLink — Router
// =========================================

const Router = {

  pages: {
    dashboard: () => Router.renderDashboard(),
    profile:   () => ProfileComponent.render(),
    donate:    () => { DonationsComponent.currentStep = 1; return DonationsComponent.renderDonate(); },
    history:   () => DonationsComponent.renderHistory(),
    hospitals: () => MapComponent.render(),
    requests:  () => RequestsComponent.render(),
  },

  navigate(page) {
    const render = this.pages[page];
    if (!render) return;

    const main = document.getElementById('mainContent');
    main.innerHTML = render();

    // Update active nav
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // Post-render hooks
    if (page === 'hospitals') {
      MapComponent.map = null;
      MapComponent.initMap();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  renderDashboard() {
    const u = AppData.currentUser;
    const g = AppData.globalStats;
    const nextDate = new Date(u.nextEligible);
    const today = new Date();
    const eligible = nextDate <= today;
    const daysLeft = Math.max(0, Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24)));
    const criticalRequests = AppData.requests.filter(r => r.urgency === 'critical');
    const nearbyHospitals = AppData.hospitals.slice(0, 3);

    return `
      <div class="page-enter">

        <!-- Hero Banner -->
        <div class="hero-banner fade-up">
          <div class="hero-greeting">Welcome Back</div>
          <div class="hero-title">Hello, <em>${u.firstName}</em>.<br/>Ready to save lives?</div>
          <div class="hero-cta">
            ${eligible
              ? `<button class="btn btn-primary btn-lg" onclick="App.navigate('donate')"><span class="heartbeat">🩸</span> Donate Now</button>`
              : `<button class="btn btn-secondary btn-lg" onclick="App.navigate('donate')">⏳ Eligible in ${daysLeft} days</button>`}
            <button class="btn btn-ghost btn-lg" onclick="App.navigate('hospitals')">🏥 Find Center</button>
          </div>
          <div class="hero-stats">
            <div>
              <div class="hero-stat-num">${u.totalDonations}</div>
              <div class="hero-stat-label">Donations</div>
            </div>
            <div>
              <div class="hero-stat-num">${u.savedLives}</div>
              <div class="hero-stat-label">Lives Saved</div>
            </div>
            <div>
              <div class="hero-stat-num">${u.points}</div>
              <div class="hero-stat-label">Points</div>
            </div>
            <div>
              <div class="hero-stat-num" style="color:var(--crimson-light)">${u.bloodType}</div>
              <div class="hero-stat-label">Blood Type</div>
            </div>
          </div>
        </div>

        <!-- Global Stats -->
        <div class="grid-4 fade-up delay-1" style="margin-bottom:28px">
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-label">Total Donors</div>
            <div class="stat-value">${g.totalDonors.toLocaleString()}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🩸</div>
            <div class="stat-label">This Month</div>
            <div class="stat-value crimson">${g.donationsThisMonth}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🌟</div>
            <div class="stat-label">Lives This Year</div>
            <div class="stat-value green">${g.livesThisYear.toLocaleString()}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🏥</div>
            <div class="stat-label">Partner Hospitals</div>
            <div class="stat-value">${g.hospitalsNetwork}</div>
          </div>
        </div>

        <div class="grid-2 fade-up delay-2">
          <!-- Critical Requests -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">🆘 Urgent Requests Near You</span>
              <button class="btn btn-ghost btn-sm" onclick="App.navigate('requests')">View All</button>
            </div>
            ${criticalRequests.map(r => `
              <div style="display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid var(--border)">
                <div class="blood-type">${r.bloodType}</div>
                <div style="flex:1">
                  <div style="font-size:0.875rem;font-weight:600;color:var(--text-primary)">${r.patientName}</div>
                  <div style="font-size:0.78rem;color:var(--text-muted)">${r.hospital} · ${r.postedAt}</div>
                </div>
                <span class="badge badge-red">${r.urgency}</span>
              </div>
            `).join('')}
            <button class="btn btn-primary" style="width:100%;margin-top:16px;justify-content:center" onclick="App.navigate('requests')">
              ❤️ Respond to Requests
            </button>
          </div>

          <!-- Nearby Hospitals -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">🏥 Nearby Donation Centers</span>
              <button class="btn btn-ghost btn-sm" onclick="App.navigate('hospitals')">View Map</button>
            </div>
            ${nearbyHospitals.map(h => `
              <div style="display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid var(--border)">
                <div style="width:40px;height:40px;border-radius:10px;background:rgba(192,21,42,0.1);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0">🏥</div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:0.875rem;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${h.name}</div>
                  <div style="font-size:0.78rem;color:var(--text-muted)">${h.distance} · ${h.availableSlots} slots</div>
                </div>
                <span class="badge ${h.urgency === 'high' || h.urgency === 'critical' ? 'badge-red' : 'badge-green'}">${h.urgency}</span>
              </div>
            `).join('')}
            <button class="btn btn-secondary" style="width:100%;margin-top:16px;justify-content:center" onclick="App.navigate('hospitals')">
              📍 Open Map
            </button>
          </div>
        </div>

        <!-- Recent Donations -->
        <div class="card fade-up delay-3" style="margin-top:20px">
          <div class="card-header">
            <span class="card-title">Recent Donations</span>
            <button class="btn btn-ghost btn-sm" onclick="App.navigate('history')">Full History</button>
          </div>
          <div class="table-wrap" style="border:none">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Hospital</th>
                  <th>City</th>
                  <th>Blood Type</th>
                  <th>Volume</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${AppData.donations.slice(0, 4).map(d => `
                  <tr>
                    <td style="font-family:var(--font-mono);font-size:0.8rem">${new Date(d.date).toLocaleDateString('en-GB')}</td>
                    <td>${d.hospital}</td>
                    <td style="color:var(--text-muted)">${d.city}</td>
                    <td><span class="badge badge-red">${d.bloodType}</span></td>
                    <td style="font-family:var(--font-mono)">${d.volume}ml</td>
                    <td><span class="badge badge-green">✓ Completed</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  },
};
