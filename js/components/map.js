// =========================================
// BloodLink — Map Component
// =========================================

const MapComponent = {
  map: null,
  markers: [],

  render(filterUrgency = 'all') {
    return `
      <div class="page-enter">
        <div class="page-header fade-up">
          <h1 class="page-title">Hospitals <span>Map</span></h1>
          <p class="page-subtitle">Find blood donation centers and hospitals near you</p>
        </div>

        <div class="grid-2 fade-up delay-1" style="gap:24px;align-items:start">
          <!-- Map -->
          <div style="grid-column:1/3">
            <div class="card" style="padding:0;overflow:hidden">
              <div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
                <span class="card-title" style="flex:1">Interactive Hospital Map</span>
                <div class="tab-bar" style="margin-bottom:0">
                  <button class="tab-btn ${filterUrgency==='all'?'active':''}" onclick="MapComponent.filterMap('all')">All</button>
                  <button class="tab-btn ${filterUrgency==='critical'?'active':''}" onclick="MapComponent.filterMap('critical')">🔴 Critical</button>
                  <button class="tab-btn ${filterUrgency==='high'?'active':''}" onclick="MapComponent.filterMap('high')">🟠 High</button>
                  <button class="tab-btn ${filterUrgency==='medium'?'active':''}" onclick="MapComponent.filterMap('medium')">🟡 Medium</button>
                </div>
              </div>
              <div id="map"></div>
            </div>
          </div>

          <!-- Hospital List -->
          <div>
            <div class="section-title">Nearby Centers</div>
            <div id="hospitalList">
              ${AppData.hospitals.map(h => this.renderHospitalCard(h)).join('')}
            </div>
          </div>

          <!-- Blood Needs -->
          <div>
            <div class="section-title">Critical Blood Needs</div>
            <div class="card">
              ${this.renderBloodNeedsTable()}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderHospitalCard(h) {
    const urgencyColor = { critical: 'badge-red', high: 'badge-red', medium: 'badge-amber', low: 'badge-green' };
    return `
      <div class="hospital-card" onclick="MapComponent.flyTo(${h.lat}, ${h.lng}, '${h.name}')">
        <div class="hospital-icon">🏥</div>
        <div class="hospital-info">
          <div class="hospital-name">${h.name}</div>
          <div class="hospital-address">${h.address}</div>
          <div class="hospital-meta">
            <span class="hospital-dist">📍 ${h.distance}</span>
            <span class="badge ${urgencyColor[h.urgency]}">${h.urgency}</span>
            <span class="badge badge-blue">⏰ ${h.availableSlots} slots</span>
          </div>
          <div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap;">
            ${h.bloodNeeded.map(b => `<span class="badge badge-red" style="font-size:0.65rem;padding:2px 6px;">${b}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
  },

  renderBloodNeedsTable() {
    const needs = {};
    AppData.hospitals.forEach(h => {
      h.bloodNeeded.forEach(b => {
        if (!needs[b]) needs[b] = { count: 0, hospitals: [] };
        needs[b].count++;
        needs[b].hospitals.push(h.name);
      });
    });

    return `
      <div class="table-wrap" style="border:none">
        <table>
          <thead>
            <tr>
              <th>Blood Type</th>
              <th>Hospitals Needing</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(needs).sort((a,b) => b[1].count - a[1].count).map(([type, data]) => `
              <tr>
                <td><span class="badge badge-red">${type}</span></td>
                <td style="color:var(--text-secondary);font-size:0.8rem;">${data.count} hospital${data.count>1?'s':''}</td>
                <td>${data.count >= 2 ? '<span class="badge badge-red">Critical</span>' : data.count === 1 ? '<span class="badge badge-amber">Needed</span>' : '<span class="badge badge-green">OK</span>'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  initMap() {
    setTimeout(() => {
      const mapEl = document.getElementById('map');
      if (!mapEl || this.map) return;

      this.map = L.map('map', { zoomControl: true }).setView([32.89, -6.91], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(this.map);

      this.addMarkers();
    }, 200);
  },

  addMarkers(filterUrgency = 'all') {
    if (!this.map) return;

    // Clear existing markers
    this.markers.forEach(m => this.map.removeLayer(m));
    this.markers = [];

    const urgencyEmoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };

    AppData.hospitals
      .filter(h => filterUrgency === 'all' || h.urgency === filterUrgency)
      .forEach(h => {
        const icon = L.divIcon({
          html: `<div style="
            background: ${h.urgency === 'critical' ? '#C0152A' : h.urgency === 'high' ? '#E8943A' : h.urgency === 'medium' ? '#E8D43A' : '#1DB97A'};
            width: 14px; height: 14px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          "></div>`,
          className: '',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const marker = L.marker([h.lat, h.lng], { icon })
          .addTo(this.map)
          .bindPopup(`
            <div class="map-popup">
              <h4>${urgencyEmoji[h.urgency]} ${h.name}</h4>
              <p>📍 ${h.address}</p>
              <p>📞 ${h.phone}</p>
              <p>🕐 ${h.hours}</p>
              <p><strong>Blood needed:</strong> ${h.bloodNeeded.join(', ')}</p>
              <p><strong>Available slots:</strong> ${h.availableSlots}</p>
            </div>
          `, { maxWidth: 260 });

        this.markers.push(marker);
      });

    // Add user location marker
    const userIcon = L.divIcon({
      html: `<div style="
        background: #3A8CE8;
        width: 16px; height: 16px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 12px rgba(58,140,232,0.6);
      "></div>`,
      className: '',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    L.marker([32.8897, -6.9060], { icon: userIcon })
      .addTo(this.map)
      .bindPopup('<div class="map-popup"><h4>📍 Your Location</h4><p>Khouribga</p></div>');
  },

  flyTo(lat, lng, name) {
    if (!this.map) return;
    this.map.flyTo([lat, lng], 14, { duration: 1.5, easeLinearity: 0.25 });
    App.showToast(`Navigating to ${name}`, 'info');
  },

  filterMap(urgency) {
    App.currentFilter = urgency;
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = this.render(urgency);
    this.map = null;
    this.initMap();
  },
};
