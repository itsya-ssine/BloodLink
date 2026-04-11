// =========================================
// BloodLink — Blood Requests Component
// =========================================

const RequestsComponent = {

  render() {
    return `
      <div class="page-enter">
        <div class="page-header fade-up">
          <h1 class="page-title">Blood <span>Requests</span></h1>
          <p class="page-subtitle">People who urgently need your blood type — respond and save a life today</p>
        </div>

        <!-- Filter & Post Button -->
        <div style="display:flex;gap:12px;align-items:center;margin-bottom:24px;flex-wrap:wrap" class="fade-up delay-1">
          <div class="tab-bar" style="margin-bottom:0">
            <button class="tab-btn active" onclick="RequestsComponent.filter('all', this)">All</button>
            <button class="tab-btn" onclick="RequestsComponent.filter('critical', this)">🔴 Critical</button>
            <button class="tab-btn" onclick="RequestsComponent.filter('urgent', this)">🟠 Urgent</button>
            <button class="tab-btn" onclick="RequestsComponent.filter('moderate', this)">🟡 Moderate</button>
          </div>
          <div style="flex:1"></div>
          <button class="btn btn-primary" onclick="RequestsComponent.openPostModal()">+ Post Request</button>
        </div>

        <!-- Stats Row -->
        <div class="grid-4 fade-up delay-2" style="margin-bottom:24px">
          <div class="stat-card">
            <div class="stat-icon">🆘</div>
            <div class="stat-label">Active Requests</div>
            <div class="stat-value crimson">${AppData.requests.length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🔴</div>
            <div class="stat-label">Critical</div>
            <div class="stat-value crimson">${AppData.requests.filter(r => r.urgency === 'critical').length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🩸</div>
            <div class="stat-label">My Blood Type</div>
            <div class="stat-value">${AppData.requests.filter(r => r.bloodType === AppData.currentUser.bloodType).length}</div>
            <div class="stat-change">Matching ${AppData.currentUser.bloodType}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✓</div>
            <div class="stat-label">Responses Today</div>
            <div class="stat-value green">24</div>
          </div>
        </div>

        <!-- Requests List -->
        <div id="requestsList" class="fade-up delay-3">
          ${AppData.requests.map(r => this.renderRequestCard(r)).join('')}
        </div>
      </div>

      <!-- Post Request Modal -->
      <div class="modal-overlay" id="postModal">
        <div class="modal">
          <div class="modal-title">Post Blood Request</div>
          <div class="modal-desc">Fill in the details to request blood for a patient</div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Patient Name</label>
              <input class="form-input" id="reqPatient" placeholder="Patient's name" />
            </div>
            <div class="form-group">
              <label class="form-label">Age</label>
              <input class="form-input" id="reqAge" type="number" placeholder="Age" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Blood Type Needed</label>
              <select class="form-select" id="reqBlood">
                ${AppData.bloodTypes.map(b => `<option value="${b}">${b}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Units Needed</label>
              <input class="form-input" id="reqUnits" type="number" placeholder="e.g. 2" min="1" max="10" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Hospital</label>
            <select class="form-select" id="reqHospital">
              ${AppData.hospitals.map(h => `<option value="${h.name}">${h.name}</option>`).join('')}
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Urgency</label>
              <select class="form-select" id="reqUrgency">
                <option value="moderate">Moderate</option>
                <option value="urgent">Urgent</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Contact Phone</label>
              <input class="form-input" id="reqContact" placeholder="+212 6 XX XX XX XX" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Reason</label>
            <textarea class="form-textarea" id="reqReason" placeholder="Describe the reason for the request..." style="min-height:80px"></textarea>
          </div>

          <div class="modal-actions">
            <button class="btn btn-secondary" onclick="RequestsComponent.closePostModal()">Cancel</button>
            <button class="btn btn-primary" onclick="RequestsComponent.postRequest()">🆘 Post Request</button>
          </div>
        </div>
      </div>

      <!-- Respond Modal -->
      <div class="modal-overlay" id="respondModal">
        <div class="modal">
          <div class="modal-title" id="respondTitle">Respond to Request</div>
          <div class="modal-desc" id="respondDesc">You are about to volunteer to donate for this patient.</div>
          <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:20px;margin-bottom:20px" id="respondDetails"></div>
          <div class="form-group">
            <label class="form-label">Your Message (Optional)</label>
            <textarea class="form-textarea" id="respondMsg" placeholder="Leave a message for the family..." style="min-height:80px"></textarea>
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" onclick="RequestsComponent.closeRespondModal()">Cancel</button>
            <button class="btn btn-primary" onclick="RequestsComponent.sendResponse()">❤️ I Want to Help</button>
          </div>
        </div>
      </div>
    `;
  },

  renderRequestCard(r) {
    const urgencyBadge = {
      critical: 'badge-red',
      urgent: 'badge-amber',
      moderate: 'badge-blue',
    };
    const isMyType = r.bloodType === AppData.currentUser.bloodType;
    return `
      <div class="request-card ${r.urgency === 'critical' ? 'urgent' : ''}" id="req-${r.id}">
        <div class="request-blood">${r.bloodType}</div>
        <div class="request-info">
          <div class="request-name">
            ${r.patientName}
            ${r.verified ? '<span class="badge badge-green" style="font-size:0.65rem">✓ Verified</span>' : ''}
            ${isMyType ? '<span class="badge badge-red" style="font-size:0.65rem">Matches Your Type</span>' : ''}
          </div>
          <div class="request-details">
            <span class="request-detail">🏥 ${r.hospital}</span>
            <span class="request-detail">📍 ${r.city}</span>
            <span class="request-detail">💉 ${r.units} unit${r.units > 1 ? 's' : ''} needed</span>
            <span class="request-detail">⏰ ${r.postedAt}</span>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <span class="badge ${urgencyBadge[r.urgency]}">${r.urgency.toUpperCase()}</span>
            <span style="font-size:0.78rem;color:var(--text-muted)">${r.reason}</span>
          </div>
        </div>
        <div class="request-actions">
          <button class="btn btn-primary btn-sm" onclick="RequestsComponent.openRespondModal(${r.id})">❤️ Respond</button>
          <a class="btn btn-secondary btn-sm" href="tel:${r.contact}">📞 Call</a>
        </div>
      </div>
    `;
  },

  filter(urgency, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filtered = urgency === 'all'
      ? AppData.requests
      : AppData.requests.filter(r => r.urgency === urgency);

    const list = document.getElementById('requestsList');
    if (list) {
      list.innerHTML = filtered.length
        ? filtered.map(r => this.renderRequestCard(r)).join('')
        : `<div class="empty-state"><div class="empty-icon">✓</div><div class="empty-title">No ${urgency} requests</div></div>`;
    }
  },

  openPostModal() {
    document.getElementById('postModal').classList.add('open');
  },

  closePostModal() {
    document.getElementById('postModal').classList.remove('open');
  },

  postRequest() {
    const patient = document.getElementById('reqPatient').value.trim();
    const blood   = document.getElementById('reqBlood').value;
    const units   = parseInt(document.getElementById('reqUnits').value) || 1;
    const hospital = document.getElementById('reqHospital').value;
    const urgency  = document.getElementById('reqUrgency').value;
    const contact  = document.getElementById('reqContact').value;
    const reason   = document.getElementById('reqReason').value;

    if (!patient || !contact) {
      App.showToast('Please fill in all required fields', 'error');
      return;
    }

    AppData.requests.unshift({
      id: Date.now(),
      patientName: patient,
      bloodType: blood,
      units, hospital,
      city: 'Khouribga',
      urgency, contact, reason,
      postedAt: 'Just now',
      verified: false,
      age: 0,
    });

    this.closePostModal();
    App.showToast('Request posted successfully!', 'success');
    App.navigate('requests');
  },

  currentRequestId: null,

  openRespondModal(id) {
    this.currentRequestId = id;
    const r = AppData.requests.find(x => x.id === id);
    if (!r) return;
    document.getElementById('respondTitle').textContent = `Help ${r.patientName}`;
    document.getElementById('respondDesc').textContent = `Patient needs ${r.units} unit(s) of ${r.bloodType} blood at ${r.hospital}.`;
    document.getElementById('respondDetails').innerHTML = `
      <div style="display:grid;gap:10px">
        <div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Blood Type</span><span class="badge badge-red">${r.bloodType}</span></div>
        <div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Hospital</span><span style="font-size:0.85rem">${r.hospital}</span></div>
        <div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Urgency</span><span class="badge badge-red">${r.urgency}</span></div>
        <div style="display:flex;justify-content:space-between"><span style="color:var(--text-muted)">Contact</span><a href="tel:${r.contact}" style="color:var(--blue)">${r.contact}</a></div>
      </div>
    `;
    document.getElementById('respondModal').classList.add('open');
  },

  closeRespondModal() {
    document.getElementById('respondModal').classList.remove('open');
  },

  sendResponse() {
    this.closeRespondModal();
    App.showToast('❤️ Thank you! The family has been notified.', 'success');
  },
};
