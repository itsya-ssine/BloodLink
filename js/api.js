// =========================================
// BloodLink — API Client
// =========================================

const BloodLinkApi = (() => {
  const API_BASE = window.BLOODLINK_ENV?.API_BASE_URL || window.BLOODLINK_API_BASE || 'http://localhost:8080/api';
  let csrfToken = null;

  async function request(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

    if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      headers,
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

  function setCsrfToken(token) {
    csrfToken = token || null;
  }

  async function bootstrapAuth() {
    const result = await request('/auth/bootstrap');
    setCsrfToken(result.csrf_token);
    return result;
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
    const firstName = row.first_name || row.firstName || '';
    const lastName = row.last_name || row.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();

    return {
      id: Number(row.id),
      firstName,
      lastName,
      fullName,
      initials: `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase(),
      email: row.email || '',
      phone: row.phone || '',
      bloodType: row.blood_type_code || row.bloodType || '',
      dateOfBirth: row.date_of_birth || row.dateOfBirth || '',
      age: calcAge(row.date_of_birth || row.dateOfBirth),
      gender: row.gender || '',
      weight: row.weight_kg ? Number(row.weight_kg) : 0,
      city: row.city || '',
      address: row.address || '',
      joinDate: row.join_date || row.joinDate || '',
      totalDonations: Number(row.total_donations || row.totalDonations || 0),
      lastDonation: row.last_donation_date || row.lastDonation || '',
      nextEligible: row.next_eligible_date || row.nextEligible || '',
      savedLives: Number(row.saved_lives || row.savedLives || 0),
      points: Number(row.points || 0),
      level: row.donor_level || row.level || 'Donor',
      eligible: Boolean(row.is_eligible ?? row.eligible),
      medicalConditions: Array.isArray(row.medical_conditions) ? row.medical_conditions : (Array.isArray(row.medicalConditions) ? row.medicalConditions : []),
      emergencyContact: {
        name: row.emergency_contact?.full_name || row.emergencyContact?.name || '',
        phone: row.emergency_contact?.phone || row.emergencyContact?.phone || '',
        relation: row.emergency_contact?.relation || row.emergencyContact?.relation || '',
      },
      achievements: Array.isArray(row.achievements) ? row.achievements : [],
      role: row.role || 'user',
      emailVerifiedAt: row.emailVerifiedAt || row.email_verified_at || null,
      twoFactorEnabled: Boolean(row.twoFactorEnabled ?? row.two_factor_enabled),
      lastLoginAt: row.lastLoginAt || row.last_login_at || null,
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

  async function getInitialData(authBootstrap = null) {
    const session = authBootstrap || await bootstrapAuth();

    if (!session.authenticated) {
      return {
        authenticated: false,
        currentUser: null,
        hospitals: [],
        donations: [],
        requests: [],
        achievements: [],
        bloodTypes: [],
        globalStats: null,
      };
    }

    const userRow = session.user;
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
      authenticated: true,
      csrfToken: csrfToken,
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

  async function login(payload) {
    const result = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setCsrfToken(result.csrf_token);
    return result;
  }

  async function register(payload) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async function logout() {
    const result = await request('/auth/logout', { method: 'POST' });
    setCsrfToken(null);
    return result;
  }

  async function verifyEmail(code) {
    return request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async function requestEmailVerification(payload = {}) {
    return request('/auth/verify-email/request', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async function forgotPassword(payload) {
    return request('/auth/password/forgot', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async function resetPassword(payload) {
    return request('/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async function updateProfile(payload) {
    const result = await request('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return result;
  }

  async function deleteAccount() {
    const result = await request('/auth/account', { method: 'DELETE' });
    setCsrfToken(null);
    return result;
  }

  async function setupTwoFactor() {
    return request('/auth/2fa/setup', { method: 'POST' });
  }

  async function confirmTwoFactor(payload) {
    return request('/auth/2fa/confirm', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async function disableTwoFactor(payload) {
    return request('/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
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
    bootstrapAuth,
    setCsrfToken,
    getInitialData,
    login,
    register,
    logout,
    verifyEmail,
    requestEmailVerification,
    forgotPassword,
    resetPassword,
    updateProfile,
    deleteAccount,
    setupTwoFactor,
    confirmTwoFactor,
    disableTwoFactor,
    updateUser,
    createRequest,
    createDonation,
  };
})();

window.BloodLinkApi = BloodLinkApi;
