-- BloodLink full dataset seed
-- Recreates all data from js/data.js

BEGIN;

TRUNCATE TABLE
  user_achievements,
  user_medical_conditions,
  user_emergency_contacts,
  donations,
  blood_requests,
  hospital_blood_needs,
  hospitals,
  achievements,
  users,
  global_stats,
  blood_types
RESTART IDENTITY CASCADE;

INSERT INTO blood_types (code) VALUES
  ('A+'), ('A-'), ('B+'), ('B-'), ('O+'), ('O-'), ('AB+'), ('AB-');

INSERT INTO achievements (id, name, description, icon_class, icon_color, sort_order) VALUES
  ('first_drop', 'First Drop', 'Made your first donation', 'bi-droplet-fill', '#E8233D', 1),
  ('triple_crown', 'Triple Crown', 'Donated 3 times', 'bi-award-fill', '#F4B63E', 2),
  ('life_saver', 'Life Saver', 'Saved 10+ lives', 'bi-stars', '#42C98A', 3),
  ('gold_heart', 'Gold Heart', 'Reached Gold Donor level', 'bi-heart-fill', '#F7C948', 4),
  ('regular_hero', 'Regular Hero', 'Donated 5 times in a year', 'bi-lightning-fill', '#5EA5FF', 5),
  ('century', 'Century Club', '10 total donations', 'bi-123', '#B886F9', 6),
  ('rare_type', 'Rare Type', 'Rare blood type donation', 'bi-gem', '#37C8E8', 7),
  ('community', 'Community Star', 'Referred 3 new donors', 'bi-people-fill', '#6EC0FF', 8),
  ('emergency', 'Emergency Hero', 'Responded to critical request', 'bi-exclamation-triangle-fill', '#FF8A47', 9),
  ('platinum', 'Platinum Donor', '20 total donations', 'bi-trophy-fill', '#A2ACC2', 10);

INSERT INTO users (
  id, first_name, last_name, email, phone, blood_type_code, date_of_birth,
  gender, weight_kg, city, address, join_date, total_donations,
  last_donation_date, next_eligible_date, saved_lives, points, donor_level, is_eligible,
  password_hash, role, email_verified_at, email_verification_token_hash, email_verification_expires_at,
  password_reset_token_hash, password_reset_expires_at, two_factor_secret, two_factor_enabled,
  two_factor_recovery_codes, last_login_at, deleted_at
) OVERRIDING SYSTEM VALUE VALUES (
  1, 'Yassine', 'Elmajdoubi', 'yassine.elmajdoubi@email.com', '+212 6 12 34 56 78', 'O+',
  DATE '2005-01-01', 'Male', 70, 'Khouribga', 'Rue Zerktouni, Khouribga 25000',
  DATE '2021-03-10', 7, DATE '2024-11-20', DATE '2025-02-20', 21, 1420, 'Gold Donor', TRUE,
  '$2y$10$qF0Z9.NFcQEfVoFBhvPFz.K6Hzx0KRRdbFPHgboqz4wzR2X6HE2fy', 'user', NOW(), NULL, NULL, NULL, NULL, NULL, FALSE,
  '[]'::jsonb, NOW(), NULL
), (
  2, 'Admin', 'BloodLink', 'admin@bloodlink.local', '+212 6 00 00 00 00', 'O+',
  DATE '1990-01-01', 'Other', 80, 'Khouribga', 'BloodLink HQ',
  DATE '2026-04-12', 0, NULL, NULL, 0, 0, 'Administrator', TRUE,
  '$2y$10$dOcl5K1WFowE76slLsDsLuM.q0ZsO/Zb6RH6uPTWz/UR.dGlssy2u', 'admin', NOW(), NULL, NULL, NULL, NULL, NULL, FALSE,
  '[]'::jsonb, NOW(), NULL
);

INSERT INTO user_emergency_contacts (user_id, full_name, phone, relation) VALUES
  (1, 'Sara Khalil', '+212 6 98 76 54 32', 'Sister');

INSERT INTO user_achievements (user_id, achievement_id, earned_at) VALUES
  (1, 'first_drop', NOW()),
  (1, 'triple_crown', NOW()),
  (1, 'life_saver', NOW()),
  (1, 'gold_heart', NOW()),
  (1, 'regular_hero', NOW());

INSERT INTO hospitals (
  id, name, address, city, phone, operating_hours, latitude, longitude,
  urgency_level, distance_label, rating, available_slots
) OVERRIDING SYSTEM VALUE VALUES
  (1, 'Centre de Transfusion Sanguine Khouribga', 'Avenue Hassan II, Khouribga 25000', 'Khouribga', '+212 5 23 49 00 11', 'Mon-Sat: 08:00-17:00', 32.889700, -6.906000, 'high', '1.2 km', 4.5, 8),
  (2, 'Hôpital Provincial Mohammed V', 'Rue Ibn Sina, Khouribga 25000', 'Khouribga', '+212 5 23 49 01 00', 'Mon-Fri: 07:30-16:30', 32.884000, -6.913000, 'medium', '2.1 km', 4.2, 5),
  (3, 'Clinique Al Amal', 'Boulevard Zerktouni, Khouribga', 'Khouribga', '+212 5 23 56 77 88', 'Daily: 09:00-18:00', 32.892000, -6.920000, 'low', '3.4 km', 4.0, 12),
  (4, 'Hôpital Régional Béni Mellal', 'Route Nationale, Béni Mellal 23000', 'Béni Mellal', '+212 5 23 48 31 31', 'Mon-Sat: 08:00-16:00', 32.337300, -6.349800, 'high', '89 km', 4.3, 3),
  (5, 'CHU Ibn Rochd', 'Rue Lamfaddel Cherkaoui, Casablanca', 'Casablanca', '+212 5 22 48 20 20', '24/7 Emergency', 33.583600, -7.613100, 'critical', '170 km', 4.7, 15),
  (6, 'CHU Mohammed VI Oujda', 'Route Sidi Maâfa, Oujda', 'Oujda', '+212 5 36 68 44 44', 'Mon-Sat: 07:00-19:00', 34.686700, -1.911400, 'medium', '367 km', 4.6, 7);

INSERT INTO hospital_blood_needs (hospital_id, blood_type_code) VALUES
  (1, 'A-'), (1, 'B-'), (1, 'AB-'), (1, 'O-'),
  (2, 'O+'), (2, 'B+'), (2, 'A+'),
  (3, 'AB+'), (3, 'A-'),
  (4, 'O-'), (4, 'B-'),
  (5, 'O+'), (5, 'O-'), (5, 'A+'), (5, 'B+'),
  (6, 'A-'), (6, 'AB-');

INSERT INTO donations (
  id, donor_user_id, hospital_id, hospital_name, city, blood_type_code, donated_at, volume_ml, status, has_certificate
) OVERRIDING SYSTEM VALUE VALUES
  (1, 1, NULL, 'CHU Mohammed VI', 'Oujda', 'O+', DATE '2024-11-20', 450, 'completed', TRUE),
  (2, 1, NULL, 'Hôpital Al Farabi', 'Oujda', 'O+', DATE '2024-07-15', 450, 'completed', TRUE),
  (3, 1, 1, 'Centre de Transfusion Khouribga', 'Khouribga', 'O+', DATE '2024-03-02', 450, 'completed', TRUE),
  (4, 1, 4, 'Hôpital Régional Béni Mellal', 'Béni Mellal', 'O+', DATE '2023-10-18', 450, 'completed', FALSE),
  (5, 1, 5, 'CHU Ibn Rochd', 'Casablanca', 'O+', DATE '2023-06-25', 450, 'completed', TRUE),
  (6, 1, 1, 'Centre de Transfusion Khouribga', 'Khouribga', 'O+', DATE '2023-01-09', 450, 'completed', TRUE),
  (7, 1, NULL, 'Hôpital Provincial Khouribga', 'Khouribga', 'O+', DATE '2022-08-30', 450, 'completed', FALSE);

INSERT INTO blood_requests (
  id, patient_name, patient_age, blood_type_code, units_needed, hospital_id, hospital_name,
  city, urgency_level, reason, posted_at_label, contact_phone, is_verified
) OVERRIDING SYSTEM VALUE VALUES
  (1, 'Fatima Ezzahra M.', 34, 'O-', 3, 2, 'Hôpital Provincial Mohammed V', 'Khouribga', 'critical', 'Emergency surgery', '2 hours ago', '+212 6 11 22 33 44', TRUE),
  (2, 'Youssef B.', 8, 'A-', 2, 1, 'Centre de Transfusion Khouribga', 'Khouribga', 'urgent', 'Thalassemia treatment', '5 hours ago', '+212 6 55 44 33 22', TRUE),
  (3, 'Samira R.', 52, 'B+', 4, 5, 'CHU Ibn Rochd', 'Casablanca', 'urgent', 'Heart bypass surgery', '1 day ago', '+212 6 77 88 99 00', FALSE),
  (4, 'Omar K.', 24, 'AB+', 2, 4, 'Hôpital Régional Béni Mellal', 'Béni Mellal', 'moderate', 'Car accident recovery', '2 days ago', '+212 6 22 11 44 55', TRUE),
  (5, 'Nadia L.', 41, 'O+', 2, 3, 'Clinique Al Amal', 'Khouribga', 'moderate', 'Scheduled surgery', '3 days ago', '+212 6 33 22 55 66', TRUE);

INSERT INTO global_stats (id, total_donors, donations_this_month, lives_this_year, hospitals_network)
VALUES (1, 14280, 843, 9214, 68)
ON CONFLICT (id) DO UPDATE
SET total_donors = EXCLUDED.total_donors,
    donations_this_month = EXCLUDED.donations_this_month,
    lives_this_year = EXCLUDED.lives_this_year,
    hospitals_network = EXCLUDED.hospitals_network,
    updated_at = NOW();

SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1), true);
SELECT setval(pg_get_serial_sequence('hospitals', 'id'), COALESCE((SELECT MAX(id) FROM hospitals), 1), true);
SELECT setval(pg_get_serial_sequence('donations', 'id'), COALESCE((SELECT MAX(id) FROM donations), 1), true);
SELECT setval(pg_get_serial_sequence('blood_requests', 'id'), COALESCE((SELECT MAX(id) FROM blood_requests), 1), true);

COMMIT;