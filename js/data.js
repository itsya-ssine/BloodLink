// =========================================
// BloodLink — Application Data
// =========================================

const AppData = {

  // ---- CURRENT USER ----
  currentUser: {
    id: 1,
    firstName: "Yassine",
    lastName: "Elmajdoubi",
    fullName: "Yassine Elmajdoubi",
    initials: "YE",
    email: "yassine.elmajdoubi@email.com",
    phone: "+212 6 12 34 56 78",
    bloodType: "O+",
    dateOfBirth: "2005-01-01",
    age: 21,
    gender: "Male",
    weight: 70,
    city: "Khouribga",
    address: "Rue Zerktouni, Khouribga 25000",
    joinDate: "2021-03-10",
    totalDonations: 7,
    lastDonation: "2024-11-20",
    nextEligible: "2025-02-20",
    savedLives: 21,
    points: 1420,
    level: "Gold Donor",
    eligible: true,
    medicalConditions: [],
    emergencyContact: { name: "Sara Khalil", phone: "+212 6 98 76 54 32", relation: "Sister" },
    achievements: ["first_drop", "triple_crown", "life_saver", "gold_heart", "regular_hero"],
  },

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
    { id: "first_drop",    icon: "🩸", name: "First Drop",     desc: "Made your first donation",         earned: true },
    { id: "triple_crown",  icon: "👑", name: "Triple Crown",   desc: "Donated 3 times",                  earned: true },
    { id: "life_saver",    icon: "🌟", name: "Life Saver",     desc: "Saved 10+ lives",                  earned: true },
    { id: "gold_heart",    icon: "💛", name: "Gold Heart",     desc: "Reached Gold Donor level",         earned: true },
    { id: "regular_hero",  icon: "⚡", name: "Regular Hero",   desc: "Donated 5 times in a year",        earned: true },
    { id: "century",       icon: "💯", name: "Century Club",   desc: "10 total donations",               earned: false },
    { id: "rare_type",     icon: "💎", name: "Rare Type",      desc: "Rare blood type donation",         earned: false },
    { id: "community",     icon: "🤝", name: "Community Star", desc: "Referred 3 new donors",            earned: false },
    { id: "emergency",     icon: "🚨", name: "Emergency Hero", desc: "Responded to critical request",   earned: false },
    { id: "platinum",      icon: "🏆", name: "Platinum Donor", desc: "20 total donations",              earned: false },
  ],

  // ---- BLOOD TYPES ----
  bloodTypes: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],

  // ---- DASHBOARD STATS ----
  globalStats: {
    totalDonors: 14280,
    donationsThisMonth: 843,
    livesThisYear: 9214,
    hospitalsNetwork: 68,
  }
};
