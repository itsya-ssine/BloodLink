// =========================================
// BloodLink — DEMO API (no backend, no database)
// Drop-in replacement for js/api.js: same BloodLinkApi surface,
// data lives in the browser (localStorage) and resets with "Reset demo".
// =========================================

const BloodLinkApi = (() => {
  const STORE_KEY = 'bloodlink-demo-store-v1';
  const SESSION_KEY = 'bloodlink-demo-session-v1';
  const LATENCY = 180; // ms, makes the UI feel like a real API

  // ---------- Seed data (hospitals, requests, achievements, history) ----------
  const SEED = {
  // ---- DONATION HISTORY ----
  donations: [
    { id: 1, date: "2024-11-20", hospital: "CHU Mohammed VI", city: "Oujda", bloodType: "O+", volume: 450, status: "completed", certificate: true },
    { id: 2, date: "2024-07-15", hospital: "Hôpital Al Farabi",  city: "Oujda", bloodType: "O+", volume: 450, status: "completed", certificate: true },
    { id: 3, date: "2024-03-02", hospital: "Centre de Transfusion Khouribga", city: "Khouribga", bloodType: "O+", volume: 450, status: "completed", certificate: true },
    { id: 4, date: "2023-10-18", hospital: "Hôpital Régional Béni Mellal", city: "Béni Mellal", bloodType: "O+", volume: 450, status: "completed", certificate: false },
    { id: 5, date: "2023-06-25", hospital: "CHU Ibn Rochd",  city: "Casablanca", bloodType: "O+", volume: 450, status: "completed", certificate: true },
    { id: 6, date: "2023-01-09", hospital: "Centre de Transfusion Khouribga", city: "Khouribga", bloodType: "O+", volume: 450, status: "completed", certificate: true },
    { id: 7, date: "2022-08-30", hospital: "Hôpital Provincial Khouribga", city: "Khouribga", bloodType: "O+", volume: 450, status: "completed", certificate: false },
  ],

  // ---- HOSPITALS ----
  hospitals: [
    {
      id: 1, name: "Centre de Transfusion Sanguine Khouribga",
      address: "Avenue Hassan II, Khouribga 25000",
      phone: "+212 5 23 49 00 11",
      hours: "Mon–Sat: 08:00–17:00",
      lat: 32.8897, lng: -6.9060,
      bloodNeeded: ["A-", "B-", "AB-", "O-"],
      urgency: "high",
      distance: "1.2 km",
      rating: 4.5,
      availableSlots: 8,
    },
    {
      id: 2, name: "Hôpital Provincial Mohammed V",
      address: "Rue Ibn Sina, Khouribga 25000",
      phone: "+212 5 23 49 01 00",
      hours: "Mon–Fri: 07:30–16:30",
      lat: 32.8840, lng: -6.9130,
      bloodNeeded: ["O+", "B+", "A+"],
      urgency: "medium",
      distance: "2.1 km",
      rating: 4.2,
      availableSlots: 5,
    },
    {
      id: 3, name: "Clinique Al Amal",
      address: "Boulevard Zerktouni, Khouribga",
      phone: "+212 5 23 56 77 88",
      hours: "Daily: 09:00–18:00",
      lat: 32.8920, lng: -6.9200,
      bloodNeeded: ["AB+", "A-"],
      urgency: "low",
      distance: "3.4 km",
      rating: 4.0,
      availableSlots: 12,
    },
    {
      id: 4, name: "Hôpital Régional Béni Mellal",
      address: "Route Nationale, Béni Mellal 23000",
      phone: "+212 5 23 48 31 31",
      hours: "Mon–Sat: 08:00–16:00",
      lat: 32.3373, lng: -6.3498,
      bloodNeeded: ["O-", "B-"],
      urgency: "high",
      distance: "89 km",
      rating: 4.3,
      availableSlots: 3,
    },
    {
      id: 5, name: "CHU Ibn Rochd",
      address: "Rue Lamfaddel Cherkaoui, Casablanca",
      phone: "+212 5 22 48 20 20",
      hours: "24/7 Emergency",
      lat: 33.5836, lng: -7.6131,
      bloodNeeded: ["O+", "O-", "A+", "B+"],
      urgency: "critical",
      distance: "170 km",
      rating: 4.7,
      availableSlots: 15,
    },
    {
      id: 6, name: "CHU Mohammed VI Oujda",
      address: "Route Sidi Maâfa, Oujda",
      phone: "+212 5 36 68 44 44",
      hours: "Mon–Sat: 07:00–19:00",
      lat: 34.6867, lng: -1.9114,
      bloodNeeded: ["A-", "AB-"],
      urgency: "medium",
      distance: "367 km",
      rating: 4.6,
      availableSlots: 7,
    },
  ],

  // ---- BLOOD REQUESTS ----
  requests: [
    {
      id: 1, patientName: "Fatima Ezzahra M.", age: 34,
      bloodType: "O-", units: 3, hospital: "Hôpital Provincial Mohammed V",
      city: "Khouribga", urgency: "critical",
      reason: "Emergency surgery", postedAt: "2 hours ago",
      contact: "+212 6 11 22 33 44", verified: true
    },
    {
      id: 2, patientName: "Youssef B.", age: 8,
      bloodType: "A-", units: 2, hospital: "Centre de Transfusion Khouribga",
      city: "Khouribga", urgency: "urgent",
      reason: "Thalassemia treatment", postedAt: "5 hours ago",
      contact: "+212 6 55 44 33 22", verified: true
    },
    {
      id: 3, patientName: "Samira R.", age: 52,
      bloodType: "B+", units: 4, hospital: "CHU Ibn Rochd",
      city: "Casablanca", urgency: "urgent",
      reason: "Heart bypass surgery", postedAt: "1 day ago",
      contact: "+212 6 77 88 99 00", verified: false
    },
    {
      id: 4, patientName: "Omar K.", age: 24,
      bloodType: "AB+", units: 2, hospital: "Hôpital Régional Béni Mellal",
      city: "Béni Mellal", urgency: "moderate",
      reason: "Car accident recovery", postedAt: "2 days ago",
      contact: "+212 6 22 11 44 55", verified: true
    },
    {
      id: 5, patientName: "Nadia L.", age: 41,
      bloodType: "O+", units: 2, hospital: "Clinique Al Amal",
      city: "Khouribga", urgency: "moderate",
      reason: "Scheduled surgery", postedAt: "3 days ago",
      contact: "+212 6 33 22 55 66", verified: true
    },
  ],

  // ---- ALL ACHIEVEMENTS ----
  achievements: [
    { id: "first_drop",    icon: "<i class=\"bi bi-droplet-fill\" style=\"color:#E8233D\" aria-hidden=\"true\"></i>", name: "First Drop",     desc: "Made your first donation",         earned: true },
    { id: "triple_crown",  icon: "<i class=\"bi bi-award-fill\" style=\"color:#F4B63E\" aria-hidden=\"true\"></i>", name: "Triple Crown",   desc: "Donated 3 times",                  earned: true },
    { id: "life_saver",    icon: "<i class=\"bi bi-stars\" style=\"color:#42C98A\" aria-hidden=\"true\"></i>", name: "Life Saver",     desc: "Saved 10+ lives",                  earned: true },
    { id: "gold_heart",    icon: "<i class=\"bi bi-heart-fill\" style=\"color:#F7C948\" aria-hidden=\"true\"></i>", name: "Gold Heart",     desc: "Reached Gold Donor level",         earned: true },
    { id: "regular_hero",  icon: "<i class=\"bi bi-lightning-fill\" style=\"color:#5EA5FF\" aria-hidden=\"true\"></i>", name: "Regular Hero",   desc: "Donated 5 times in a year",        earned: true },
    { id: "century",       icon: "<i class=\"bi bi-123\" style=\"color:#B886F9\" aria-hidden=\"true\"></i>", name: "Century Club",   desc: "10 total donations",               earned: false },
    { id: "rare_type",     icon: "<i class=\"bi bi-gem\" style=\"color:#37C8E8\" aria-hidden=\"true\"></i>", name: "Rare Type",      desc: "Rare blood type donation",         earned: false },
    { id: "community",     icon: "<i class=\"bi bi-people-fill\" style=\"color:#6EC0FF\" aria-hidden=\"true\"></i>", name: "Community Star", desc: "Referred 3 new donors",            earned: false },
    { id: "emergency",     icon: "<i class=\"bi bi-exclamation-triangle-fill\" style=\"color:#FF8A47\" aria-hidden=\"true\"></i>", name: "Emergency Hero", desc: "Responded to critical request",   earned: false },
    { id: "platinum",      icon: "<i class=\"bi bi-trophy-fill\" style=\"color:#A2ACC2\" aria-hidden=\"true\"></i>", name: "Platinum Donor", desc: "20 total donations",              earned: false },
  ]
  };

  const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const GLOBAL_STATS = { totalDonors: 14280, donationsThisMonth: 843, livesThisYear: 9214, hospitalsNetwork: 68 };

  const DEMO_ACCOUNTS = [
    {
      password: 'demo1234',
      user: {
        id: 1, firstName: 'Ahmed', lastName: 'Khalil', email: 'demo@bloodlink.app',
        phone: '+212 6 12 34 56 78', bloodType: 'O+', dateOfBirth: '1999-05-14', gender: 'Male',
        weight: 72, city: 'Khouribga', address: 'Avenue Hassan II, Khouribga 25000',
        joinDate: '2021-03-10', totalDonations: 7, lastDonation: '2024-11-20', nextEligible: '2025-02-20',
        savedLives: 21, points: 1420, level: 'Gold Donor', eligible: true, medicalConditions: [],
        emergencyContact: { name: 'Sara Khalil', phone: '+212 6 98 76 54 32', relation: 'Sister' },
        achievements: ['first_drop', 'triple_crown', 'life_saver', 'gold_heart', 'regular_hero'],
        role: 'user', emailVerifiedAt: '2021-03-10T10:00:00Z', twoFactorEnabled: false,
        lastLoginAt: null, createdAt: '2021-03-10T10:00:00Z', deletedAt: null,
      },
    },
    {
      password: 'admin1234',
      user: {
        id: 2, firstName: 'Admin', lastName: 'BloodLink', email: 'admin@bloodlink.app',
        phone: '+212 6 00 00 00 00', bloodType: 'A+', dateOfBirth: '1990-01-01', gender: 'Female',
        weight: 62, city: 'Casablanca', address: 'Bd Zerktouni, Casablanca',
        joinDate: '2020-01-01', totalDonations: 12, lastDonation: '2024-09-02', nextEligible: '2024-12-01',
        savedLives: 36, points: 2600, level: 'Platinum Donor', eligible: true, medicalConditions: [],
        emergencyContact: { name: 'Karim B.', phone: '+212 6 00 00 00 01', relation: 'Brother' },
        achievements: ['first_drop', 'triple_crown', 'life_saver', 'century'],
        role: 'admin', emailVerifiedAt: '2020-01-01T10:00:00Z', twoFactorEnabled: false,
        lastLoginAt: null, createdAt: '2020-01-01T10:00:00Z', deletedAt: null,
      },
    },
  ];

  // ---------- Store ----------
  const clone = x => JSON.parse(JSON.stringify(x));
  const wait = (ms = LATENCY) => new Promise(r => setTimeout(r, ms));
  let memoryStore = null; // fallback when localStorage is blocked
  let csrfToken = null;

  function freshStore() {
    return {
      accounts: clone(DEMO_ACCOUNTS),
      donations: { 1: clone(SEED.donations), 2: [] },
      requests: clone(SEED.requests),
      nextUserId: 3,
    };
  }

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) { /* storage unavailable */ }
    return memoryStore || (memoryStore = freshStore());
  }

  function saveStore(store) {
    memoryStore = store;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (_) { /* ignore */ }
  }

  function getSessionUserId() {
    try { return Number(localStorage.getItem(SESSION_KEY)) || null; } catch (_) { return memoryStore?._session || null; }
  }

  function setSessionUserId(id) {
    try {
      if (id) localStorage.setItem(SESSION_KEY, String(id));
      else localStorage.removeItem(SESSION_KEY);
    } catch (_) {
      memoryStore = memoryStore || freshStore();
      memoryStore._session = id || null;
    }
  }

  function currentAccount(store) {
    const id = getSessionUserId();
    return store.accounts.find(a => a.user.id === id && !a.user.deletedAt) || null;
  }

  function publicUser(account) {
    const u = clone(account.user);
    u.fullName = `${u.firstName} ${u.lastName}`.trim();
    u.initials = `${u.firstName[0] || ''}${u.lastName[0] || ''}`.toUpperCase();
    u.age = calcAge(u.dateOfBirth);
    return u;
  }

  function calcAge(dateStr) {
    if (!dateStr) return 0;
    const dob = new Date(dateStr);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    return Math.max(0, age);
  }

  function newCsrf() {
    csrfToken = 'demo-' + Math.random().toString(36).slice(2);
    return csrfToken;
  }

  function fail(message, status) {
    const err = new Error(message);
    err.status = status;
    return err;
  }

  // ---------- Public API (same names as js/api.js) ----------
  function setCsrfToken(token) { csrfToken = token || null; }

  async function bootstrapAuth() {
    await wait(80);
    const account = currentAccount(loadStore());
    const token = csrfToken || newCsrf();
    return account
      ? { authenticated: true, csrf_token: token, user: publicUser(account) }
      : { authenticated: false, csrf_token: token };
  }

  async function getInitialData(authBootstrap = null) {
    const session = authBootstrap || await bootstrapAuth();
    if (!session.authenticated) {
      return {
        authenticated: false, currentUser: null, hospitals: [], donations: [], requests: [],
        achievements: [], bloodTypes: [], globalStats: null,
      };
    }

    await wait();
    const store = loadStore();
    const account = currentAccount(store);
    if (!account) {
      return {
        authenticated: false, currentUser: null, hospitals: [], donations: [], requests: [],
        achievements: [], bloodTypes: [], globalStats: null,
      };
    }

    const user = publicUser(account);
    const earned = new Set(user.achievements || []);

    return {
      currentUser: user,
      authenticated: true,
      csrfToken,
      hospitals: clone(SEED.hospitals),
      donations: clone(store.donations[user.id] || []),
      requests: clone(store.requests),
      achievements: SEED.achievements.map(a => ({ ...a, earned: earned.has(a.id) })),
      bloodTypes: [...BLOOD_TYPES],
      globalStats: { ...GLOBAL_STATS },
    };
  }

  async function login(payload = {}) {
    await wait();
    const email = String(payload.email || '').trim().toLowerCase();
    const password = String(payload.password || '');
    if (!email || !password) throw fail('Email and password are required', 422);

    const store = loadStore();
    const account = store.accounts.find(a => a.user.email.toLowerCase() === email && !a.user.deletedAt);
    if (!account || account.password !== password) throw fail('Invalid email or password', 401);

    account.user.lastLoginAt = new Date().toISOString();
    saveStore(store);
    setSessionUserId(account.user.id);
    return { user: publicUser(account), csrf_token: newCsrf() };
  }

  async function register(payload = {}) {
    await wait();
    const required = ['first_name', 'last_name', 'email', 'password'];
    if (required.some(k => !String(payload[k] || '').trim())) throw fail('Missing required registration fields', 422);
    if (String(payload.password).length < 8) throw fail('Password must be at least 8 characters', 422);
    if (payload.password !== payload.password_confirmation) throw fail('Password confirmation does not match', 422);

    const email = String(payload.email).trim().toLowerCase();
    const store = loadStore();
    if (store.accounts.some(a => a.user.email.toLowerCase() === email)) throw fail('Email is already registered', 409);

    const id = store.nextUserId++;
    const now = new Date().toISOString();
    store.accounts.push({
      password: String(payload.password),
      user: {
        id,
        firstName: String(payload.first_name).trim(),
        lastName: String(payload.last_name).trim(),
        email,
        phone: String(payload.phone || ''),
        bloodType: String(payload.blood_type_code || ''),
        dateOfBirth: String(payload.date_of_birth || ''),
        gender: String(payload.gender || ''),
        weight: Number(payload.weight_kg) || 0,
        city: String(payload.city || ''),
        address: String(payload.address || ''),
        joinDate: now.slice(0, 10),
        totalDonations: 0, lastDonation: '', nextEligible: '', savedLives: 0, points: 0,
        level: 'New Donor', eligible: true,
        medicalConditions: Array.isArray(payload.medical_conditions) ? payload.medical_conditions : [],
        emergencyContact: {
          name: String(payload.emergency_contact_name || ''),
          phone: String(payload.emergency_contact_phone || ''),
          relation: String(payload.emergency_contact_relation || ''),
        },
        achievements: [],
        role: 'user',
        emailVerifiedAt: now, // demo: no email step, accounts are verified immediately
        twoFactorEnabled: false, lastLoginAt: null, createdAt: now, deletedAt: null,
      },
    });
    store.donations[id] = [];
    saveStore(store);

    return {
      status: 'registered',
      message: 'Demo account created. No email needed, you can sign in right away.',
      verification_link: null,
    };
  }

  async function logout() {
    await wait(80);
    setSessionUserId(null);
    setCsrfToken(null);
    return { status: 'logged_out' };
  }

  async function verifyEmail() {
    await wait();
    return { message: 'Demo mode: emails are auto-verified. You can sign in now.' };
  }

  async function requestEmailVerification() {
    await wait();
    return { status: 'sent', verification_link: null };
  }

  async function forgotPassword() {
    await wait();
    return { status: 'sent', reset_link: null };
  }

  async function resetPassword() {
    await wait();
    return { status: 'password_reset' };
  }

  async function updateProfile(payload = {}) {
    await wait();
    const store = loadStore();
    const account = currentAccount(store);
    if (!account) throw fail('Authentication required', 401);

    const u = account.user;
    if (payload.first_name !== undefined) u.firstName = String(payload.first_name);
    if (payload.last_name !== undefined) u.lastName = String(payload.last_name);
    if (payload.phone !== undefined) u.phone = String(payload.phone);
    if (payload.city !== undefined) u.city = String(payload.city);
    if (payload.address !== undefined) u.address = String(payload.address);
    if (payload.weight_kg !== undefined && !Number.isNaN(Number(payload.weight_kg))) u.weight = Number(payload.weight_kg);
    saveStore(store);
    return { user: publicUser(account) };
  }

  async function deleteAccount() {
    await wait();
    const store = loadStore();
    const account = currentAccount(store);
    if (!account) throw fail('Authentication required', 401);
    if (account.user.id <= 2) throw fail('The built-in demo accounts cannot be deleted. Create your own account to test this.', 403);
    account.user.deletedAt = new Date().toISOString();
    saveStore(store);
    setSessionUserId(null);
    setCsrfToken(null);
    return { status: 'deleted' };
  }

  async function setupTwoFactor() {
    await wait();
    return { otpauth_url: 'otpauth://totp/BloodLink:demo?secret=DEMODEMODEMODEMO&issuer=BloodLink' };
  }

  async function confirmTwoFactor() { await wait(); return { status: 'enabled' }; }
  async function disableTwoFactor() { await wait(); return { status: 'disabled' }; }

  async function updateUser(userId, payload = {}) {
    return updateProfile(payload);
  }

  async function getAdminUsers() {
    await wait();
    const store = loadStore();
    const account = currentAccount(store);
    if (!account) throw fail('Authentication required', 401);
    if (account.user.role !== 'admin') throw fail('Forbidden', 403);

    return store.accounts.map(a => ({
      id: a.user.id,
      first_name: a.user.firstName,
      last_name: a.user.lastName,
      email: a.user.email,
      role: a.user.role,
      email_verified_at: a.user.emailVerifiedAt,
      last_login_at: a.user.lastLoginAt,
      created_at: a.user.createdAt,
      deleted_at: a.user.deletedAt,
    }));
  }

  async function createRequest(payload = {}) {
    await wait();
    const store = loadStore();
    const account = currentAccount(store);
    if (!account) throw fail('Authentication required', 401);

    const id = Date.now();
    store.requests.unshift({
      id,
      patientName: payload.patient_name,
      age: payload.patient_age || 0,
      bloodType: payload.blood_type_code,
      units: payload.units_needed,
      hospital: payload.hospital_name,
      city: payload.city || '',
      urgency: payload.urgency_level,
      reason: payload.reason || '',
      postedAt: 'Just now',
      contact: payload.contact_phone,
      verified: false,
    });
    saveStore(store);
    return { id };
  }

  async function createDonation(payload = {}) {
    await wait();
    const store = loadStore();
    const account = currentAccount(store);
    if (!account) throw fail('Authentication required', 401);

    const id = Date.now();
    const list = store.donations[account.user.id] || (store.donations[account.user.id] = []);
    list.unshift({
      id,
      date: payload.donated_at,
      hospital: payload.hospital_name,
      city: payload.city || '',
      bloodType: payload.blood_type_code,
      volume: payload.volume_ml || 450,
      status: payload.status || 'completed',
      certificate: Boolean(payload.has_certificate),
    });
    saveStore(store);
    return { id };
  }

  // Demo helper: wipe local changes and sign out
  function resetDemo() {
    try {
      localStorage.removeItem(STORE_KEY);
      localStorage.removeItem(SESSION_KEY);
    } catch (_) { /* ignore */ }
    memoryStore = null;
    csrfToken = null;
  }

  return {
    bootstrapAuth, setCsrfToken, getInitialData, login, register, logout,
    verifyEmail, requestEmailVerification, forgotPassword, resetPassword,
    updateProfile, deleteAccount, setupTwoFactor, confirmTwoFactor, disableTwoFactor,
    updateUser, getAdminUsers, createRequest, createDonation, resetDemo,
  };
})();

window.BloodLinkApi = BloodLinkApi;

// Shown on the login screen by js/components/auth.js
window.BLOODLINK_DEMO = {
  accounts: [
    { label: 'Donor', email: 'demo@bloodlink.app', password: 'demo1234' },
    { label: 'Admin', email: 'admin@bloodlink.app', password: 'admin1234' },
  ],
};
