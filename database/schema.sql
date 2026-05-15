
BEGIN;

-- -----------------------------
-- Reference tables
-- -----------------------------
CREATE TABLE blood_types (
  code VARCHAR(3) PRIMARY KEY,
  CONSTRAINT blood_type_code_chk CHECK (code IN ('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'))
);

CREATE TABLE achievements (
  id VARCHAR(40) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon_class VARCHAR(80) NOT NULL,
  icon_color VARCHAR(20),
  sort_order SMALLINT NOT NULL DEFAULT 0
);

-- -----------------------------
-- Core entities
-- -----------------------------
CREATE TABLE users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Identity
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(40) NOT NULL,
  blood_type_code VARCHAR(3) NOT NULL REFERENCES blood_types(code),
  date_of_birth DATE NOT NULL,
  gender VARCHAR(20),
  weight_kg NUMERIC(5,2),
  city VARCHAR(120),
  address TEXT,

  -- Donor stats
  join_date DATE NOT NULL,
  total_donations INTEGER NOT NULL DEFAULT 0,
  last_donation_date DATE,
  next_eligible_date DATE,
  saved_lives INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  donor_level VARCHAR(60),
  is_eligible BOOLEAN NOT NULL DEFAULT TRUE,

  -- Auth
  password_hash TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  email_verified_at TIMESTAMPTZ,
  email_verification_token_hash TEXT,
  email_verification_expires_at TIMESTAMPTZ,
  password_reset_token_hash TEXT,
  password_reset_expires_at TIMESTAMPTZ,
  two_factor_secret TEXT,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_recovery_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_login_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT users_total_donations_chk CHECK (total_donations >= 0),
  CONSTRAINT users_saved_lives_chk CHECK (saved_lives >= 0),
  CONSTRAINT users_points_chk CHECK (points >= 0),
  CONSTRAINT users_weight_chk CHECK (weight_kg IS NULL OR weight_kg >= 0)
);

CREATE TABLE user_emergency_contacts (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  relation VARCHAR(60)
);

CREATE TABLE user_medical_conditions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  condition_name VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, condition_name)
);

CREATE TABLE hospitals (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(200) NOT NULL UNIQUE,
  address TEXT NOT NULL,
  city VARCHAR(120),
  phone VARCHAR(40),
  operating_hours VARCHAR(120),
  latitude NUMERIC(9,6) NOT NULL,
  longitude NUMERIC(9,6) NOT NULL,
  urgency_level VARCHAR(16) NOT NULL,
  distance_label VARCHAR(30),
  rating NUMERIC(2,1),
  available_slots INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT hospitals_urgency_chk CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT hospitals_slots_chk CHECK (available_slots >= 0),
  CONSTRAINT hospitals_rating_chk CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5))
);

CREATE TABLE hospital_blood_needs (
  hospital_id BIGINT NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  blood_type_code VARCHAR(3) NOT NULL REFERENCES blood_types(code),
  PRIMARY KEY (hospital_id, blood_type_code)
);

-- -----------------------------
-- User activity
-- -----------------------------
CREATE TABLE donations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  donor_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hospital_id BIGINT REFERENCES hospitals(id) ON DELETE SET NULL,
  hospital_name VARCHAR(200) NOT NULL,
  city VARCHAR(120),
  blood_type_code VARCHAR(3) NOT NULL REFERENCES blood_types(code),
  donated_at DATE NOT NULL,
  volume_ml INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  has_certificate BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT donations_volume_chk CHECK (volume_ml > 0),
  CONSTRAINT donations_status_chk CHECK (status IN ('scheduled', 'completed', 'cancelled', 'missed'))
);

CREATE TABLE blood_requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_name VARCHAR(160) NOT NULL,
  patient_age INTEGER,
  blood_type_code VARCHAR(3) NOT NULL REFERENCES blood_types(code),
  units_needed INTEGER NOT NULL,
  hospital_id BIGINT REFERENCES hospitals(id) ON DELETE SET NULL,
  hospital_name VARCHAR(200) NOT NULL,
  city VARCHAR(120),
  urgency_level VARCHAR(16) NOT NULL,
  reason TEXT,
  posted_at_label VARCHAR(40),
  contact_phone VARCHAR(40) NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT blood_requests_units_chk CHECK (units_needed > 0),
  CONSTRAINT blood_requests_age_chk CHECK (patient_age IS NULL OR patient_age >= 0),
  CONSTRAINT blood_requests_urgency_chk CHECK (urgency_level IN ('moderate', 'urgent', 'critical'))
);

CREATE TABLE user_achievements (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(40) NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, achievement_id)
);

-- -----------------------------
-- Dashboard/global snapshots
-- -----------------------------
CREATE TABLE global_stats (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  total_donors INTEGER NOT NULL,
  donations_this_month INTEGER NOT NULL,
  lives_this_year INTEGER NOT NULL,
  hospitals_network INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT global_stats_single_row_chk CHECK (id = 1),
  CONSTRAINT global_stats_nonnegative_chk CHECK (
    total_donors >= 0 AND
    donations_this_month >= 0 AND
    lives_this_year >= 0 AND
    hospitals_network >= 0
  )
);

-- -----------------------------
-- Indexes
-- -----------------------------

-- Donor activity
CREATE INDEX idx_donations_user_date        ON donations(donor_user_id, donated_at DESC);
CREATE INDEX idx_blood_requests_urgency     ON blood_requests(urgency_level, created_at DESC);
CREATE INDEX idx_hospital_needs_blood_type  ON hospital_blood_needs(blood_type_code);

-- Auth
CREATE INDEX idx_users_email_verified_at    ON users(email_verified_at);
CREATE INDEX idx_users_role                 ON users(role);
CREATE INDEX idx_users_deleted_at           ON users(deleted_at);

-- -----------------------------
-- Seed data
-- -----------------------------
INSERT INTO blood_types (code) VALUES
  ('A+'), ('A-'), ('B+'), ('B-'), ('O+'), ('O-'), ('AB+'), ('AB-')
ON CONFLICT (code) DO NOTHING;

COMMIT;