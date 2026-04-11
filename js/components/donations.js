// =========================================
// BloodLink — Donations Component
// =========================================

const DonationsComponent = {

  currentStep: 1,

  // ---- DONATE PAGE ----
  renderDonate() {
    const u = AppData.currentUser;
    const nextDate = new Date(u.nextEligible);
    const today = new Date();
    const eligible = nextDate <= today;
    const daysLeft = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));

    if (!eligible) {
      return `
        <div class="page-enter">
          <div class="page-header fade-up">
            <h1 class="page-title">Donate <span>Blood</span></h1>
            <p class="page-subtitle">Schedule your next life-saving donation</p>
          </div>
          <div class="card fade-up delay-1" style="text-align:center;padding:60px 40px">
            <div style="font-size:4rem;margin-bottom:20px"><i class="bi bi-hourglass-split" aria-hidden="true"></i></div>
            <h2 style="font-family:var(--font-display);font-size:1.8rem;margin-bottom:12px;">Not Eligible Yet</h2>
            <p style="color:var(--text-secondary);margin-bottom:24px;font-size:0.95rem;">
              You last donated on <strong>${new Date(u.lastDonation).toLocaleDateString('en-GB')}</strong>.<br/>
              You can donate again in <strong style="color:var(--amber)">${daysLeft} days</strong> (${new Date(u.nextEligible).toLocaleDateString('en-GB')}).
            </p>
            <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:20px;max-width:400px;margin:0 auto 24px;">
              <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:8px;">Recovery Progress</div>
              <div class="progress-bar" style="height:10px">
                <div class="progress-fill" style="width:${Math.min(100, Math.round(((84 - daysLeft) / 84) * 100))}%"></div>
              </div>
              <div style="font-size:0.78rem;color:var(--text-muted);margin-top:6px;">${Math.max(0, 84 - daysLeft)}/84 days recovery</div>
            </div>
            <button class="btn btn-secondary" onclick="App.navigate('hospitals')"><i class="bi bi-hospital" aria-hidden="true"></i> Find Hospitals</button>
          </div>
        </div>
      `;
    }

    return `
      <div class="page-enter">
        <div class="page-header fade-up">
          <h1 class="page-title">Donate <span>Blood</span></h1>
          <p class="page-subtitle">Complete the steps below to schedule your donation</p>
        </div>

        <!-- Step Indicator -->
        <div class="steps fade-up delay-1">
          ${this.renderStep(1, 'Eligibility')}
          <div class="step-connector ${this.currentStep > 1 ? 'done' : ''}"></div>
          ${this.renderStep(2, 'Select Center')}
          <div class="step-connector ${this.currentStep > 2 ? 'done' : ''}"></div>
          ${this.renderStep(3, 'Schedule')}
          <div class="step-connector ${this.currentStep > 3 ? 'done' : ''}"></div>
          ${this.renderStep(4, 'Confirm')}
        </div>

        <div id="donateStepContent">
          ${this.renderStepContent(this.currentStep)}
        </div>
      </div>
    `;
  },

  renderStep(num, label) {
    const cls = num < this.currentStep ? 'step done' : num === this.currentStep ? 'step active' : 'step';
    return `
      <div class="${cls}">
        <div class="step-num">${num < this.currentStep ? '<i class="bi bi-check" aria-hidden="true"></i>' : num}</div>
        <div class="step-label">${label}</div>
      </div>
    `;
  },

  renderStepContent(step) {
    const steps = [null, this.step1(), this.step2(), this.step3(), this.step4()];
    return steps[step] || '';
  },

  step1() {
    const items = [
      "I am between 18 and 65 years old",
      "I weigh at least 50 kg",
      "I feel healthy and well today",
      "I have not had a piercing or tattoo in the last 6 months",
      "I have not taken antibiotics in the last 7 days",
      "I have not donated blood in the last 84 days",
      "I have not consumed alcohol in the last 24 hours",
    ];
    return `
      <div class="card fade-up">
        <div class="card-header">
          <span class="card-title">Eligibility Checklist</span>
          <span class="badge badge-green">Step 1 of 4</span>
        </div>
        <div class="alert alert-urgent">
          <div class="alert-icon"><i class="bi bi-info-circle" aria-hidden="true"></i></div>
          <div>
            <div class="alert-title">Please confirm all conditions</div>
            <div class="alert-desc">Check all boxes that apply to you. Your safety is our priority.</div>
          </div>
        </div>
        <div class="eligibility-list" id="eligibilityList">
          ${items.map((item, i) => `
            <div class="eligibility-item" id="eli-${i}" onclick="DonationsComponent.toggleEligibility(${i})">
              <div class="check-circle" id="check-${i}"></div>
              <span class="eligibility-text">${item}</span>
            </div>
          `).join('')}
        </div>
        <div style="margin-top:24px;display:flex;justify-content:flex-end">
          <button class="btn btn-primary" id="eligibilityNext" onclick="DonationsComponent.nextStep()" disabled style="opacity:0.4;cursor:not-allowed">
            Continue → Select Center
          </button>
        </div>
      </div>
    `;
  },

  step2() {
    return `
      <div class="card fade-up">
        <div class="card-header">
          <span class="card-title">Choose Donation Center</span>
          <span class="badge badge-green">Step 2 of 4</span>
        </div>
        <div class="grid-2" style="gap:12px;margin-bottom:20px">
          ${AppData.hospitals.slice(0, 4).map(h => `
            <div class="hospital-card" id="hCard-${h.id}" onclick="DonationsComponent.selectHospital(${h.id})" style="margin-bottom:0;cursor:pointer;">
              <div class="hospital-icon"><i class="bi bi-hospital" aria-hidden="true"></i></div>
              <div class="hospital-info">
                <div class="hospital-name">${h.name}</div>
                <div class="hospital-address">${h.city}</div>
                <div class="hospital-meta">
                  <span class="hospital-dist"><i class="bi bi-geo-alt" aria-hidden="true"></i> ${h.distance}</span>
                  <span class="badge badge-blue"><i class="bi bi-clock" aria-hidden="true"></i> ${h.availableSlots} slots</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        <div style="display:flex;gap:12px;justify-content:space-between">
          <button class="btn btn-secondary" onclick="DonationsComponent.prevStep()">← Back</button>
          <button class="btn btn-primary" id="hospitalNext" onclick="DonationsComponent.nextStep()" disabled style="opacity:0.4;cursor:not-allowed">
            Continue → Schedule
          </button>
        </div>
      </div>
    `;
  },

  step3() {
    const today = new Date();
    const dates = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    const times = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];
    return `
      <div class="card fade-up">
        <div class="card-header">
          <span class="card-title">Schedule Your Appointment</span>
          <span class="badge badge-green">Step 3 of 4</span>
        </div>
        <div class="form-group">
          <label class="form-label">Select Date</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap" id="dateSelector">
            ${dates.map(d => `
              <button class="btn btn-ghost btn-sm date-btn" data-date="${d.toISOString().split('T')[0]}"
                onclick="DonationsComponent.selectDate(this, '${d.toISOString().split('T')[0]}')">
                <div style="text-align:center">
                  <div style="font-size:0.7rem;color:var(--text-muted)">${d.toLocaleDateString('en',{weekday:'short'})}</div>
                  <div style="font-weight:700;font-size:1rem">${d.getDate()}</div>
                  <div style="font-size:0.7rem;color:var(--text-muted)">${d.toLocaleDateString('en',{month:'short'})}</div>
                </div>
              </button>
            `).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Select Time</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap" id="timeSelector">
            ${times.map(t => `
              <button class="btn btn-ghost time-btn" data-time="${t}"
                onclick="DonationsComponent.selectTime(this, '${t}')">
                ${t}
              </button>
            `).join('')}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Additional Notes (Optional)</label>
          <textarea class="form-textarea" id="donateNotes" placeholder="Any medical conditions or notes for the staff..."></textarea>
        </div>
        <div style="display:flex;gap:12px;justify-content:space-between">
          <button class="btn btn-secondary" onclick="DonationsComponent.prevStep()">← Back</button>
          <button class="btn btn-primary" id="scheduleNext" onclick="DonationsComponent.nextStep()" disabled style="opacity:0.4;cursor:not-allowed">
            Continue → Confirm
          </button>
        </div>
      </div>
    `;
  },

  step4() {
    const s = DonationsComponent.selection || {};
    const hospital = AppData.hospitals.find(h => h.id === s.hospitalId) || AppData.hospitals[0];
    return `
      <div class="card fade-up">
        <div class="card-header">
          <span class="card-title">Confirm Your Appointment</span>
          <span class="badge badge-green">Step 4 of 4</span>
        </div>
        <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:24px;margin-bottom:20px">
          <div style="display:grid;gap:14px">
            ${this.confirmRow('<i class="bi bi-hospital" aria-hidden="true"></i> Hospital', hospital.name)}
            ${this.confirmRow('<i class="bi bi-geo-alt" aria-hidden="true"></i> Address', hospital.address)}
            ${this.confirmRow('<i class="bi bi-calendar-event" aria-hidden="true"></i> Date', s.date ? new Date(s.date).toLocaleDateString('en-GB', {weekday:'long',year:'numeric',month:'long',day:'numeric'}) : 'Not selected')}
            ${this.confirmRow('<i class="bi bi-clock" aria-hidden="true"></i> Time', s.time || 'Not selected')}
            ${this.confirmRow('<i class="bi bi-droplet-fill" aria-hidden="true"></i> Blood Type', AppData.currentUser.bloodType)}
            ${this.confirmRow('<i class="bi bi-eyedropper" aria-hidden="true"></i> Donation Type', 'Whole Blood (450ml)')}
          </div>
        </div>
        <div class="alert alert-urgent">
          <div class="alert-icon"><i class="bi bi-clipboard2-check" aria-hidden="true"></i></div>
          <div>
            <div class="alert-title">Before you go</div>
            <div class="alert-desc">Drink plenty of water, eat a light meal, and bring a valid ID. Wear comfortable clothing.</div>
          </div>
        </div>
        <div style="display:flex;gap:12px;justify-content:space-between">
          <button class="btn btn-secondary" onclick="DonationsComponent.prevStep()">← Back</button>
          <button class="btn btn-primary btn-lg" onclick="DonationsComponent.confirm()">
            <span class="heartbeat"><i class="bi bi-droplet-fill" aria-hidden="true"></i></span> Confirm Appointment
          </button>
        </div>
      </div>
    `;
  },

  confirmRow(label, value) {
    return `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:0.85rem;color:var(--text-secondary)">${label}</span>
        <span style="font-size:0.875rem;font-weight:600;color:var(--text-primary)">${value}</span>
      </div>
    `;
  },

  // ---- HISTORY PAGE ----
  renderHistory() {
    const donations = AppData.donations;
    return `
      <div class="page-enter">
        <div class="page-header fade-up">
          <h1 class="page-title">Donation <span>History</span></h1>
          <p class="page-subtitle">Your complete record of life-saving donations</p>
        </div>

        <div class="grid-4 fade-up delay-1" style="margin-bottom:28px">
          <div class="stat-card">
            <div class="stat-icon"><i class="bi bi-droplet-fill" aria-hidden="true"></i></div>
            <div class="stat-label">Total Donations</div>
            <div class="stat-value crimson">${donations.length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><i class="bi bi-stars" aria-hidden="true"></i></div>
            <div class="stat-label">Lives Saved</div>
            <div class="stat-value green">${AppData.currentUser.savedLives}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><i class="bi bi-heart-pulse-fill" aria-hidden="true"></i></div>
            <div class="stat-label">Total Volume</div>
            <div class="stat-value">${donations.length * 450}<span style="font-size:1rem;color:var(--text-muted)">ml</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><i class="bi bi-calendar2-week-fill" aria-hidden="true"></i></div>
            <div class="stat-label">This Year</div>
            <div class="stat-value">${donations.filter(d => new Date(d.date).getFullYear() === new Date().getFullYear()).length}</div>
          </div>
        </div>

        <!-- Timeline -->
        <div class="grid-2 fade-up delay-2">
          <div class="card">
            <div class="card-title" style="margin-bottom:20px">Donation Timeline</div>
            <div class="timeline">
              ${donations.map((d, i) => `
                <div class="timeline-item">
                  <div style="position:relative">
                    <div class="timeline-dot"></div>
                    ${i < donations.length - 1 ? '<div class="timeline-line"></div>' : ''}
                  </div>
                  <div class="timeline-content">
                    <div class="timeline-date">${new Date(d.date).toLocaleDateString('en-GB')}</div>
                    <div class="timeline-title">${d.hospital}</div>
                    <div class="timeline-desc">${d.city} · ${d.volume}ml · <span style="color:var(--green)"><i class="bi bi-check-circle-fill" aria-hidden="true"></i> Completed</span></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Records Table -->
          <div class="card" style="padding:0;overflow:hidden">
            <div style="padding:20px 20px 0">
              <div class="card-title">All Records</div>
            </div>
            <div class="table-wrap" style="border:none;border-radius:0;margin-top:16px">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Hospital</th>
                    <th>Blood</th>
                    <th>Cert</th>
                  </tr>
                </thead>
                <tbody>
                  ${donations.map(d => `
                    <tr>
                      <td style="font-family:var(--font-mono);font-size:0.78rem">${new Date(d.date).toLocaleDateString('en-GB')}</td>
                      <td style="font-size:0.82rem">${d.hospital.split(' ').slice(0,3).join(' ')}</td>
                      <td><span class="badge badge-red">${d.bloodType}</span></td>
                      <td>${d.certificate ? '<span class="badge badge-green"><i class="bi bi-check-lg" aria-hidden="true"></i></span>' : '<span class="badge" style="opacity:0.4">-</span>'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ---- STEP NAVIGATION ----
  selection: {},

  toggleEligibility(i) {
    const item = document.getElementById(`eli-${i}`);
    const check = document.getElementById(`check-${i}`);
    const isChecked = item.classList.toggle('checked');
    check.innerHTML = isChecked ? '<i class="bi bi-check" aria-hidden="true"></i>' : '';

    const total = document.querySelectorAll('.eligibility-item').length;
    const checked = document.querySelectorAll('.eligibility-item.checked').length;
    const btn = document.getElementById('eligibilityNext');
    if (btn) {
      const allChecked = checked === total;
      btn.disabled = !allChecked;
      btn.style.opacity = allChecked ? '1' : '0.4';
      btn.style.cursor = allChecked ? 'pointer' : 'not-allowed';
    }
  },

  selectHospital(id) {
    document.querySelectorAll('.hospital-card').forEach(c => {
      c.style.borderColor = '';
      c.style.background = '';
    });
    const card = document.getElementById(`hCard-${id}`);
    if (card) {
      card.style.borderColor = 'var(--crimson-light)';
      card.style.background = 'rgba(192,21,42,0.05)';
    }
    this.selection.hospitalId = id;
    const btn = document.getElementById('hospitalNext');
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; btn.style.cursor = 'pointer'; }
  },

  selectDate(el, date) {
    document.querySelectorAll('.date-btn').forEach(b => { b.style.borderColor = ''; b.style.background = ''; b.style.color = ''; });
    el.style.borderColor = 'var(--crimson-light)';
    el.style.background = 'rgba(192,21,42,0.1)';
    el.style.color = 'var(--crimson-light)';
    this.selection.date = date;
    this.checkSchedule();
  },

  selectTime(el, time) {
    document.querySelectorAll('.time-btn').forEach(b => { b.style.borderColor = ''; b.style.background = ''; b.style.color = ''; });
    el.style.borderColor = 'var(--crimson-light)';
    el.style.background = 'rgba(192,21,42,0.1)';
    el.style.color = 'var(--crimson-light)';
    this.selection.time = time;
    this.checkSchedule();
  },

  checkSchedule() {
    const btn = document.getElementById('scheduleNext');
    if (!btn) return;
    const ready = this.selection.date && this.selection.time;
    btn.disabled = !ready;
    btn.style.opacity = ready ? '1' : '0.4';
    btn.style.cursor = ready ? 'pointer' : 'not-allowed';
  },

  nextStep() {
    if (this.currentStep < 4) {
      this.currentStep++;
      document.getElementById('donateStepContent').innerHTML = this.renderStepContent(this.currentStep);
      document.getElementById('donateStepContent').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      document.getElementById('donateStepContent').innerHTML = this.renderStepContent(this.currentStep);
    }
  },

  async confirm() {
    // Add donation to history
    const h = AppData.hospitals.find(x => x.id === this.selection.hospitalId) || AppData.hospitals[0];
    const donationDate = this.selection.date;

    if (window.BloodLinkApi) {
      try {
        await window.BloodLinkApi.createDonation({
          donor_user_id: AppData.currentUser.id,
          hospital_id: h.id,
          hospital_name: h.name,
          city: h.city,
          blood_type_code: AppData.currentUser.bloodType,
          donated_at: donationDate,
          volume_ml: 450,
          status: 'completed',
          has_certificate: true,
        });
      } catch (err) {
        App.showToast('Could not confirm appointment in backend', 'error');
        return;
      }
    }

    AppData.donations.unshift({
      id: Date.now(),
      date: donationDate,
      hospital: h.name,
      city: h.city || '',
      bloodType: AppData.currentUser.bloodType,
      volume: 450,
      status: 'completed',
      certificate: true,
    });

    AppData.currentUser.totalDonations += 1;
    AppData.currentUser.savedLives += 3;
    AppData.currentUser.lastDonation = this.selection.date;
    const next = new Date(this.selection.date);
    next.setDate(next.getDate() + 84);
    AppData.currentUser.nextEligible = next.toISOString().split('T')[0];
    AppData.currentUser.eligible = false;

    this.currentStep = 1;
    this.selection = {};

    App.showToast('Appointment confirmed! See you at ' + h.name, 'success');
    App.navigate('history');
  },
};
