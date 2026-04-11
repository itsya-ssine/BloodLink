-- Minimal database seed for BloodLink app startup
-- Run after schema.sql

BEGIN;

-- Ensure required singleton dashboard row exists
INSERT INTO global_stats (id, total_donors, donations_this_month, lives_this_year, hospitals_network)
VALUES (1, 1, 1, 3, 1)
ON CONFLICT (id) DO UPDATE
SET total_donors = EXCLUDED.total_donors,
    donations_this_month = EXCLUDED.donations_this_month,
    lives_this_year = EXCLUDED.lives_this_year,
    hospitals_network = EXCLUDED.hospitals_network,
    updated_at = NOW();

-- Seed achievements used by frontend
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
  ('platinum', 'Platinum Donor', '20 total donations', 'bi-trophy-fill', '#A2ACC2', 10)
ON CONFLICT (id) DO NOTHING;

-- Seed one current user (required by /api/users/current)
INSERT INTO users (
  first_name, last_name, email, phone, blood_type_code, date_of_birth,
  gender, weight_kg, city, address, join_date, total_donations,
  last_donation_date, next_eligible_date, saved_lives, points, donor_level, is_eligible
)
VALUES (
  'Yassine', 'Elmajdoubi', 'yassine.elmajdoubi@email.com', '+212 6 12 34 56 78', 'O+',
  DATE '2005-01-01', 'Male', 70, 'Khouribga', 'Rue Zerktouni, Khouribga 25000',
  DATE '2021-03-10', 1, DATE '2024-11-20', DATE '2025-02-20', 3, 1420, 'Gold Donor', TRUE
)
ON CONFLICT (email) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    blood_type_code = EXCLUDED.blood_type_code,
    date_of_birth = EXCLUDED.date_of_birth,
    gender = EXCLUDED.gender,
    weight_kg = EXCLUDED.weight_kg,
    city = EXCLUDED.city,
    address = EXCLUDED.address,
    join_date = EXCLUDED.join_date,
    total_donations = EXCLUDED.total_donations,
    last_donation_date = EXCLUDED.last_donation_date,
    next_eligible_date = EXCLUDED.next_eligible_date,
    saved_lives = EXCLUDED.saved_lives,
    points = EXCLUDED.points,
    donor_level = EXCLUDED.donor_level,
    is_eligible = EXCLUDED.is_eligible,
    updated_at = NOW();

INSERT INTO user_emergency_contacts (user_id, full_name, phone, relation)
VALUES (
  (SELECT id FROM users WHERE email = 'yassine.elmajdoubi@email.com' LIMIT 1),
  'Sara Khalil',
  '+212 6 98 76 54 32',
  'Sister'
)
ON CONFLICT (user_id) DO UPDATE
SET full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    relation = EXCLUDED.relation;

INSERT INTO user_achievements (user_id, achievement_id, earned_at) VALUES
  ((SELECT id FROM users WHERE email = 'yassine.elmajdoubi@email.com' LIMIT 1), 'first_drop', NOW()),
  ((SELECT id FROM users WHERE email = 'yassine.elmajdoubi@email.com' LIMIT 1), 'triple_crown', NOW()),
  ((SELECT id FROM users WHERE email = 'yassine.elmajdoubi@email.com' LIMIT 1), 'life_saver', NOW()),
  ((SELECT id FROM users WHERE email = 'yassine.elmajdoubi@email.com' LIMIT 1), 'gold_heart', NOW()),
  ((SELECT id FROM users WHERE email = 'yassine.elmajdoubi@email.com' LIMIT 1), 'regular_hero', NOW())
ON CONFLICT (user_id, achievement_id) DO NOTHING;

-- Seed one hospital so map/donation center UI is functional
INSERT INTO hospitals (
  name, address, city, phone, operating_hours, latitude, longitude,
  urgency_level, distance_label, rating, available_slots
)
VALUES (
  'Centre de Transfusion Sanguine Khouribga', 'Avenue Hassan II, Khouribga 25000',
  'Khouribga', '+212 5 23 49 00 11', 'Mon-Sat: 08:00-17:00',
  32.889700, -6.906000, 'high', '1.2 km', 4.5, 8
)
ON CONFLICT (name) DO UPDATE
SET address = EXCLUDED.address,
    city = EXCLUDED.city,
    phone = EXCLUDED.phone,
    operating_hours = EXCLUDED.operating_hours,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    urgency_level = EXCLUDED.urgency_level,
    distance_label = EXCLUDED.distance_label,
    rating = EXCLUDED.rating,
    available_slots = EXCLUDED.available_slots,
    updated_at = NOW();

INSERT INTO hospital_blood_needs (hospital_id, blood_type_code) VALUES
  ((SELECT id FROM hospitals WHERE name = 'Centre de Transfusion Sanguine Khouribga' LIMIT 1), 'A-'),
  ((SELECT id FROM hospitals WHERE name = 'Centre de Transfusion Sanguine Khouribga' LIMIT 1), 'B-'),
  ((SELECT id FROM hospitals WHERE name = 'Centre de Transfusion Sanguine Khouribga' LIMIT 1), 'AB-'),
  ((SELECT id FROM hospitals WHERE name = 'Centre de Transfusion Sanguine Khouribga' LIMIT 1), 'O-')
ON CONFLICT (hospital_id, blood_type_code) DO NOTHING;

COMMIT;
