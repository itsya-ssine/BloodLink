// =========================================
// BloodLink — API Client
// =========================================

const BloodLinkApi = (() => {
  const API_BASE = window.BLOODLINK_ENV?.API_BASE_URL || window.BLOODLINK_API_BASE || 'http://localhost:8080/api';

  async function request(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });

    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    const payload = isJson ? await res.json() : null;

    if (!res.ok) {
      const message = payload?.error || `Request failed (${res.status})`;
      throw new Error(message);
    }

    return payload;
  }

  function calcAge(dateStr) {
    if (!dateStr) return 0;
    const dob = new Date(dateStr);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    return age;
  }

  function mapUser(row) {
    const firstName = row.first_name || '';
    const lastName = row.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();

    return {
      id: Number(row.id),
      firstName,
      lastName,
      fullName,
      initials: `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase(),
      email: row.email || '',
      phone: row.phone || '',
      bloodType: row.blood_type_code || '',
      dateOfBirth: row.date_of_birth || '',
      age: calcAge(row.date_of_birth),
      gender: row.gender || '',
      weight: row.weight_kg ? Number(row.weight_kg) : 0,
      city: row.city || '',
      address: row.address || '',
      joinDate: row.join_date || '',
      totalDonations: Number(row.total_donations || 0),
      lastDonation: row.last_donation_date || '',
      nextEligible: row.next_eligible_date || '',
      savedLives: Number(row.saved_lives || 0),
      points: Number(row.points || 0),
      level: row.donor_level || 'Donor',
      eligible: Boolean(row.is_eligible),
      medicalConditions: Array.isArray(row.medical_conditions) ? row.medical_conditions : [],
      emergencyContact: {
        name: row.emergency_contact?.full_name || '',
        phone: row.emergency_contact?.phone || '',
        relation: row.emergency_contact?.relation || '',
      },
      achievements: Array.isArray(row.achievements) ? row.achievements : [],
    };
  }

  function mapHospital(row) {
    return {
      id: Number(row.id),
      name: row.name,
      address: row.address,
      phone: row.phone,
      hours: row.operating_hours,
      lat: Number(row.latitude),
      lng: Number(row.longitude),
      bloodNeeded: row.blood_needed || [],
      urgency: row.urgency_level,
      distance: row.distance_label || '',
      rating: row.rating ? Number(row.rating) : 0,
      availableSlots: Number(row.available_slots || 0),
      city: row.city || '',
    };
  }

  function mapDonation(row) {
    return {
      id: Number(row.id),
      date: row.donated_at,
      hospital: row.hospital_name,
      city: row.city || '',
      bloodType: row.blood_type_code,
      volume: Number(row.volume_ml || 0),
      status: row.status,
      certificate: Boolean(row.has_certificate),
    };
  }

  function mapRequest(row) {
    return {
      id: Number(row.id),
      patientName: row.patient_name,
      age: row.patient_age ? Number(row.patient_age) : 0,
      bloodType: row.blood_type_code,
      units: Number(row.units_needed || 0),
      hospital: row.hospital_name,
      city: row.city || '',
      urgency: row.urgency_level,
      reason: row.reason || '',
      postedAt: row.posted_at_label || 'Just now',
      contact: row.contact_phone,
      verified: Boolean(row.is_verified),
    };
  }

  function mapAchievement(row, earnedIds) {
    const iconClass = row.icon_class || 'bi-award-fill';
    const iconColor = row.icon_color ? ` style="color:${row.icon_color}"` : '';

    return {
      id: row.id,
      icon: `<i class="bi ${iconClass}"${iconColor} aria-hidden="true"></i>`,
      name: row.name,
      desc: row.description,
      earned: earnedIds.has(row.id),
    };
  }

  async function getInitialData() {
    const userRow = await request('/users/current');
    const userId = Number(userRow?.id || 0);

    const [hospitalsRows, donationsRows, requestsRows, achievementsRows, statsRow, bloodTypesRows] = await Promise.all([
      request('/hospitals'),
      request(`/donations?user_id=${userId}`),
      request('/requests'),
      request('/achievements'),
      request('/global-stats'),
      request('/blood-types'),
    ]);

    const user = mapUser(userRow);
    const earnedIds = new Set(user.achievements || []);

    return {
      currentUser: user,
      hospitals: (hospitalsRows || []).map(mapHospital),
      donations: (donationsRows || []).map(mapDonation),
      requests: (requestsRows || []).map(mapRequest),
      achievements: (achievementsRows || []).map(row => mapAchievement(row, earnedIds)),
      bloodTypes: (bloodTypesRows || []).map(row => row.code),
      globalStats: {
        totalDonors: Number(statsRow?.total_donors || 0),
        donationsThisMonth: Number(statsRow?.donations_this_month || 0),
        livesThisYear: Number(statsRow?.lives_this_year || 0),
        hospitalsNetwork: Number(statsRow?.hospitals_network || 0),
      },
    };
  }

  async function updateUser(userId, payload) {
    return request(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async function createRequest(payload) {
    return request('/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async function createDonation(payload) {
    return request('/donations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  return {
    getInitialData,
    updateUser,
    createRequest,
    createDonation,
  };
})();

window.BloodLinkApi = BloodLinkApi;
