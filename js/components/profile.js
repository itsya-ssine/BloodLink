// =========================================
// BloodLink — Profile Component
// =========================================

const ProfileComponent = {

  render() {
    const u = AppData.currentUser;
    const age = new Date().getFullYear() - new Date(u.dateOfBirth).getFullYear();
    const nextDate = new Date(u.nextEligible);
    const today = new Date();
    const daysUntil = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
    const eligibleNow = daysUntil <= 0;

    return `
      <div class="page-enter">
        <div class="page-header fade-up">
          <h1 class="page-title">My <span>Profile</span></h1>
          <p class="page-subtitle">Manage your personal information and donation settings</p>
        </div>

        <!-- Profile Card -->
        <div class="profile-cover-inner fade-up delay-1">
          <div class="profile-cover">
            <div style="position:absolute;top:50%;right:40px;transform:translateY(-50%);opacity:0.15;font-size:5rem;"><i class="bi bi-droplet-fill" aria-hidden="true"></i></div>
          </div>
          <div class="profile-identity">
            <div class="profile-avatar-large">${u.initials}</div>
            <div class="profile-meta">
              <div class="profile-name">${u.fullName}</div>
              <div class="profile-role">${u.level} · Member since ${new Date(u.joinDate).getFullYear()}</div>
              <div class="profile-badges">
                <span class="badge badge-red"><i class="bi bi-droplet-fill" aria-hidden="true"></i> ${u.bloodType}</span>
                <span class="badge badge-green"><i class="bi bi-patch-check-fill" aria-hidden="true"></i> Verified Donor</span>
                ${eligibleNow ? '<span class="badge badge-green pulse-red"><i class="bi bi-check-circle-fill" aria-hidden="true"></i> Eligible Now</span>' : `<span class="badge badge-amber"><i class="bi bi-hourglass-split" aria-hidden="true"></i> ${daysUntil}d until eligible</span>`}
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="ProfileComponent.openEditModal()"><i class="bi bi-pencil-square" aria-hidden="true"></i> Edit Profile</button>
          </div>
          <div class="profile-stats-row">
            <div class="profile-stat">
              <div class="profile-stat-val">${u.totalDonations}</div>
              <div class="profile-stat-lbl">Donations</div>
            </div>
            <div class="profile-stat">
              <div class="profile-stat-val">${u.savedLives}</div>
              <div class="profile-stat-lbl">Lives Saved</div>
            </div>
            <div class="profile-stat">
              <div class="profile-stat-val">${u.points}</div>
              <div class="profile-stat-lbl">Points</div>
            </div>
          </div>
        </div>

        <div class="grid-2">
          <!-- Personal Info -->
          <div class="card fade-up delay-2">
            <div class="card-header">
              <span class="card-title">Personal Information</span>
              <button class="btn btn-ghost btn-sm" onclick="ProfileComponent.openEditModal()">Edit</button>
            </div>
            ${this.infoRow("Full Name", u.fullName)}
            ${this.infoRow("Date of Birth", `${new Date(u.dateOfBirth).toLocaleDateString('en-GB')} (Age ${age})`)}
            ${this.infoRow("Gender", u.gender)}
            ${this.infoRow("Blood Type", `<span class="badge badge-red"><i class="bi bi-droplet-fill" aria-hidden="true"></i> ${u.bloodType}</span>`)}
            ${this.infoRow("Weight", `${u.weight} kg`)}
            ${this.infoRow("City", u.city)}
            ${this.infoRow("Address", u.address)}
          </div>

          <!-- Contact Info -->
          <div class="card fade-up delay-3">
            <div class="card-header">
              <span class="card-title">Contact & Medical</span>
              <button class="btn btn-ghost btn-sm" onclick="ProfileComponent.openEditModal()">Edit</button>
            </div>
            ${this.infoRow("Email", u.email)}
            ${this.infoRow("Phone", u.phone)}
            <div class="divider"></div>
            <div class="section-title">Emergency Contact</div>
            ${this.infoRow("Name", u.emergencyContact.name)}
            ${this.infoRow("Phone", u.emergencyContact.phone)}
            ${this.infoRow("Relation", u.emergencyContact.relation)}
            <div class="divider"></div>
            <div class="section-title">Donation Status</div>
            ${this.infoRow("Last Donation", new Date(u.lastDonation).toLocaleDateString('en-GB'))}
            ${this.infoRow("Next Eligible", eligibleNow ? '<span class="badge badge-green">Eligible Now</span>' : new Date(u.nextEligible).toLocaleDateString('en-GB'))}
            ${this.infoRow("Medical Conditions", u.medicalConditions.length ? u.medicalConditions.join(', ') : '<span style="color:var(--green)">None reported</span>')}
          </div>
        </div>

        <!-- Achievements -->
        <div class="card fade-up delay-4" style="margin-top:20px">
          <div class="card-header">
            <span class="card-title">Achievements</span>
            <span class="badge badge-amber"><i class="bi bi-trophy-fill" aria-hidden="true"></i> ${u.achievements.length}/${AppData.achievements.length} Earned</span>
          </div>
          <div class="achievements-grid">
            ${AppData.achievements.map(a => `
              <div class="achievement ${a.earned ? 'earned' : 'locked'}">
                <div class="achievement-icon">${a.icon}</div>
                <div class="achievement-name">${a.name}</div>
                <div class="achievement-desc">${a.desc}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Edit Modal -->
      <div class="modal-overlay" id="editModal">
        <div class="modal">
          <div class="modal-title">Edit Profile</div>
          <div class="modal-desc">Update your personal information and preferences</div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">First Name</label>
              <input class="form-input" id="editFirstName" value="${u.firstName}" />
            </div>
            <div class="form-group">
              <label class="form-label">Last Name</label>
              <input class="form-input" id="editLastName" value="${u.lastName}" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input class="form-input" id="editPhone" value="${u.phone}" />
            </div>
            <div class="form-group">
              <label class="form-label">City</label>
              <input class="form-input" id="editCity" value="${u.city}" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Address</label>
            <input class="form-input" id="editAddress" value="${u.address}" />
          </div>
          <div class="form-group">
            <label class="form-label">Weight (kg)</label>
            <input class="form-input" id="editWeight" type="number" value="${u.weight}" />
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" onclick="ProfileComponent.closeEditModal()">Cancel</button>
            <button class="btn btn-primary" onclick="ProfileComponent.saveProfile()"><i class="bi bi-floppy-fill" aria-hidden="true"></i> Save Changes</button>
          </div>
        </div>
      </div>
    `;
  },

  infoRow(label, value) {
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);">
        <span style="font-size:0.8rem;color:var(--text-muted);font-weight:500;">${label}</span>
        <span style="font-size:0.875rem;color:var(--text-primary);font-weight:500;text-align:right;max-width:60%;">${value}</span>
      </div>
    `;
  },

  openEditModal() {
    document.getElementById('editModal').classList.add('open');
  },

  closeEditModal() {
    document.getElementById('editModal').classList.remove('open');
  },

  async saveProfile() {
    const u = AppData.currentUser;
    u.firstName = document.getElementById('editFirstName').value;
    u.lastName  = document.getElementById('editLastName').value;
    u.fullName  = `${u.firstName} ${u.lastName}`;
    u.initials  = `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
    u.phone     = document.getElementById('editPhone').value;
    u.city      = document.getElementById('editCity').value;
    u.address   = document.getElementById('editAddress').value;
    u.weight    = parseInt(document.getElementById('editWeight').value);

    if (window.BloodLinkApi) {
      try {
        await window.BloodLinkApi.updateUser(u.id, {
          first_name: u.firstName,
          last_name: u.lastName,
          phone: u.phone,
          city: u.city,
          address: u.address,
          weight_kg: u.weight,
        });
      } catch (err) {
        App.showToast('Could not save profile to backend', 'error');
        return;
      }
    }

    // Update sidebar
    document.getElementById('sidebarName').textContent = u.fullName;
    document.getElementById('sidebarAvatar').textContent = u.initials;
    document.getElementById('mobileAvatar').textContent = u.initials;

    this.closeEditModal();
    App.showToast('Profile updated successfully!', 'success');
    App.navigate('profile');
  },
};
