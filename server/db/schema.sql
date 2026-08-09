-- ============================================
-- Reservation Portal — Database Schema
-- ============================================
USE reservation_portal;

-- 1. USERS (base account for all roles)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(15),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('customer','owner','admin') NOT NULL DEFAULT 'customer',
  email_verified BOOLEAN DEFAULT FALSE,
  status ENUM('active','suspended','banned') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. OWNER_PROFILES (owner-only extension of users)
CREATE TABLE owner_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  pan_number VARCHAR(10),
  business_name VARCHAR(150),
  business_address VARCHAR(255),
  stripe_account_id VARCHAR(100),
  payouts_enabled BOOLEAN DEFAULT FALSE,
  balance INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 3. SPORT_CATEGORIES (master list)
CREATE TABLE sport_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

-- 4. TURFS (listings; owner must be an owner_profile)
CREATE TABLE turfs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  sport_category_id INT,
  size ENUM('5v5','7v7','11v11'),
  surface_type VARCHAR(50),
  location_address VARCHAR(255) NOT NULL,
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  price_per_hour INT NOT NULL CHECK (price_per_hour > 0),
  opening_time TIME NOT NULL,
  closing_time TIME NOT NULL,
  slot_duration INT DEFAULT 60,
  max_booking_duration INT DEFAULT 3,
  status ENUM('pending','needs_correction','rejected','approved','unlisted','taken_down') DEFAULT 'pending',
  rejection_reason TEXT,
  rejection_count INT DEFAULT 0,
  last_rejection_at DATETIME,
  strike_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES owner_profiles(id),
  FOREIGN KEY (sport_category_id) REFERENCES sport_categories(id)
);

-- 5. TURF_IMAGES
CREATE TABLE turf_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  turf_id INT NOT NULL,
  image_key VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (turf_id) REFERENCES turfs(id) ON DELETE CASCADE
);

-- 6. AMENITIES (master list)
CREATE TABLE amenities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

-- 7. TURF_AMENITIES (many-to-many)
CREATE TABLE turf_amenities (
  turf_id INT NOT NULL,
  amenity_id INT NOT NULL,
  PRIMARY KEY (turf_id, amenity_id),
  FOREIGN KEY (turf_id) REFERENCES turfs(id) ON DELETE CASCADE,
  FOREIGN KEY (amenity_id) REFERENCES amenities(id)
);

-- 8. BLOCKED_SLOTS (owner maintenance blocks)
CREATE TABLE blocked_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  turf_id INT NOT NULL,
  block_date DATE NOT NULL,
  block_time TIME NOT NULL,
  reason VARCHAR(100),
  UNIQUE KEY unique_block (turf_id, block_date, block_time),
  FOREIGN KEY (turf_id) REFERENCES turfs(id) ON DELETE CASCADE
);

-- 9. BOOKINGS
CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  turf_id INT NOT NULL,
  customer_id INT NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_hours INT NOT NULL CHECK (duration_hours BETWEEN 1 AND 3),
  total_amount INT NOT NULL,
  status ENUM('held','confirmed','completed','cancelled') DEFAULT 'held',
  payment_status ENUM('unpaid','paid','refunded','partially_refunded') DEFAULT 'unpaid',
  hold_expires_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (turf_id) REFERENCES turfs(id),
  FOREIGN KEY (customer_id) REFERENCES users(id)
);

-- 10. BOOKED_SLOTS (the double-booking guarantee)
CREATE TABLE booked_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  turf_id INT NOT NULL,
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  UNIQUE KEY unique_slot (turf_id, slot_date, slot_time),
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (turf_id) REFERENCES turfs(id)
);

-- 11. PAYMENTS (ledger)
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL UNIQUE,
  total_amount INT NOT NULL,
  commission INT NOT NULL,
  owner_share INT NOT NULL,
  stripe_payment_intent_id VARCHAR(100),
  status ENUM('pending','succeeded','failed','refunded','partially_refunded') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- 12. REFUNDS (ledger; reaches booking via payment)
CREATE TABLE refunds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_id INT NOT NULL,
  refund_amount INT NOT NULL,
  reason ENUM('cancellation','rain','dispute') NOT NULL,
  refund_type ENUM('full','partial') NOT NULL,
  commission_refunded_amount INT DEFAULT 0,   -- changed from BOOLEAN
  owner_debited INT DEFAULT 0,
  stripe_refund_id VARCHAR(100),
  status ENUM('pending','succeeded','failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id)
);

-- 13. OWNER_BALANCE_TRANSACTIONS (balance history)
CREATE TABLE owner_balance_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  payment_id INT,
  refund_id INT,
  amount INT NOT NULL,
  type ENUM('earning','clawback','payout','adjustment') NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES owner_profiles(id),
  FOREIGN KEY (payment_id) REFERENCES payments(id),
  FOREIGN KEY (refund_id) REFERENCES refunds(id)
);

-- 14. REVIEWS (one per booking)
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL UNIQUE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  owner_response TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- 15. DISPUTES
CREATE TABLE disputes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  type ENUM('turf_closed','unavailable','not_as_described','double_booked','other') NOT NULL,
  description TEXT,
  status ENUM('open','resolved','refunded','denied') DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- 16. PLATFORM_SETTINGS (key-value)
CREATE TABLE platform_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(50) NOT NULL UNIQUE,
  setting_value VARCHAR(255) NOT NULL
);

-- (+) NOTIFICATIONS (optional)
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Stripe webhook idempotency
CREATE TABLE stripe_webhook_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL UNIQUE,   -- Stripe's evt_... id
  event_type VARCHAR(100),                 -- e.g. payment_intent.succeeded
  status ENUM('received','processed','failed') DEFAULT 'received',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP NULL
);

CREATE TABLE refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE turf_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  existing_user_id INT,                    -- set if an existing customer applies; NULL for a new person
  applicant_name VARCHAR(100) NOT NULL,
  applicant_email VARCHAR(150) NOT NULL,
  applicant_phone VARCHAR(15),
  pan_number VARCHAR(10),
  business_name VARCHAR(150),
  business_address VARCHAR(255),
  turf_name VARCHAR(150) NOT NULL,
  sport_category_id INT,
  size ENUM('5v5','7v7','11v11'),
  surface_type VARCHAR(50),
  location_address VARCHAR(255),
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  price_per_hour INT,
  opening_time TIME,
  closing_time TIME,
  slot_duration INT DEFAULT 60,
  max_booking_duration INT DEFAULT 3,
  amenities JSON,                          -- promoted to turf_amenities on approval
  photos JSON,                             -- promoted to turf_images on approval
  rules TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  status ENUM('pending','needs_correction','rejected','approved') DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (existing_user_id) REFERENCES users(id),
  FOREIGN KEY (sport_category_id) REFERENCES sport_categories(id)
);