-- ============================================================
-- GYM MANAGEMENT SYSTEM — DATABASE SCHEMA
-- ============================================================

CREATE DATABASE IF NOT EXISTS gym_management;
USE gym_management;

-- ------------------------------------------------------------
-- USERS (authentication — both admin and members log in here)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  user_id     INT AUTO_INCREMENT PRIMARY KEY,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        ENUM('admin', 'member') NOT NULL DEFAULT 'member',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- MEMBERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS members (
  member_id       INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  member_code     VARCHAR(20) UNIQUE,            -- e.g. GM-00501
  name            VARCHAR(255) NOT NULL,
  email           VARCHAR(255) NOT NULL,
  phone           VARCHAR(20),
  date_of_birth   DATE,
  gender          ENUM('Male', 'Female', 'Other'),
  address         TEXT,
  profile_image   VARCHAR(500),                  -- S3 key
  date_joined     DATE NOT NULL DEFAULT (CURRENT_DATE),
  status          ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- MEMBERSHIP PLANS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS membership_plans (
  plan_id          INT AUTO_INCREMENT PRIMARY KEY,
  plan_name        VARCHAR(255) NOT NULL,
  duration_months  INT NOT NULL,
  price            DECIMAL(10, 2) NOT NULL,
  description      TEXT,
  features         JSON,                          -- array of feature strings
  status           ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- MEMBERSHIPS (member ↔ plan assignment)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memberships (
  membership_id   INT AUTO_INCREMENT PRIMARY KEY,
  member_id       INT NOT NULL,
  plan_id         INT NOT NULL,
  start_date      DATE NOT NULL,
  expiry_date     DATE NOT NULL,
  status          ENUM('active', 'expired', 'cancelled') NOT NULL DEFAULT 'active',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id)   REFERENCES membership_plans(plan_id)
);

-- ------------------------------------------------------------
-- ATTENDANCE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance (
  attendance_id   INT AUTO_INCREMENT PRIMARY KEY,
  member_id       INT NOT NULL,
  attendance_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  check_in_time   TIME NOT NULL,
  check_out_time  TIME,
  status          ENUM('present', 'absent', 'late') NOT NULL DEFAULT 'present',
  notes           VARCHAR(500),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- PAYMENTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  payment_id          INT AUTO_INCREMENT PRIMARY KEY,
  member_id           INT NOT NULL,
  membership_id       INT,
  amount              DECIMAL(10, 2) NOT NULL,
  currency            VARCHAR(10) NOT NULL DEFAULT 'INR',
  payment_date        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_status      ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
  payment_method      VARCHAR(100),
  receipt_number      VARCHAR(100) UNIQUE,        -- e.g. GYM-2026-001025
  razorpay_order_id   VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  razorpay_signature  VARCHAR(500),
  notes               TEXT,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id)     REFERENCES members(member_id) ON DELETE CASCADE,
  FOREIGN KEY (membership_id) REFERENCES memberships(membership_id)
);

-- ------------------------------------------------------------
-- RECEIPTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS receipts (
  receipt_id      INT AUTO_INCREMENT PRIMARY KEY,
  payment_id      INT NOT NULL UNIQUE,
  member_id       INT NOT NULL,
  receipt_number  VARCHAR(100) NOT NULL UNIQUE,
  file_name       VARCHAR(255) NOT NULL,
  s3_object_key   VARCHAR(500),                  -- NULL if saved locally
  local_path      VARCHAR(500),                  -- fallback for local dev
  generated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE,
  FOREIGN KEY (member_id)  REFERENCES members(member_id)  ON DELETE CASCADE
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Admin user  (password: Admin@123 or password)
INSERT INTO users (email, password, role) VALUES
  ('admin@gymms.com', '$2a$10$BFLOoHGXfGuFQ2jgZnPU1OuTQxnM2p/ru1MJ2nsqzxxV2yr3U126C', 'admin'),
  ('demo@gmail.com',  '$2a$10$BFLOoHGXfGuFQ2jgZnPU1OuTQxnM2p/ru1MJ2nsqzxxV2yr3U126C', 'admin');

-- Sample member users  (password: Member@123 or password)
INSERT INTO users (email, password, role) VALUES
  ('rahul@example.com',  '$2a$10$BFLOoHGXfGuFQ2jgZnPU1OuTQxnM2p/ru1MJ2nsqzxxV2yr3U126C', 'member'),
  ('priya@example.com',  '$2a$10$BFLOoHGXfGuFQ2jgZnPU1OuTQxnM2p/ru1MJ2nsqzxxV2yr3U126C', 'member'),
  ('arjun@example.com',  '$2a$10$BFLOoHGXfGuFQ2jgZnPU1OuTQxnM2p/ru1MJ2nsqzxxV2yr3U126C', 'member');

-- Members
INSERT INTO members (user_id, member_code, name, email, phone, date_of_birth, gender, address, date_joined, status) VALUES
  (2, 'GM-00001', 'Rahul Kumar',   'rahul@example.com', '9876543210', '1998-05-12', 'Male',   '12, MG Road, Chennai', '2026-01-15', 'active'),
  (3, 'GM-00002', 'Priya Sharma',  'priya@example.com', '9876543211', '2000-08-22', 'Female', '45, Anna Nagar, Chennai', '2026-02-01', 'active'),
  (4, 'GM-00003', 'Arjun Nair',    'arjun@example.com', '9876543212', '1995-11-30', 'Male',   '78, T Nagar, Chennai', '2026-03-10', 'active');

-- Membership Plans
INSERT INTO membership_plans (plan_name, duration_months, price, description, features) VALUES
  ('Basic',    1, 999.00,  'Monthly basic plan with gym access',
   '["Gym Access", "Locker Room", "Basic Equipment"]'),
  ('Standard', 3, 2499.00, 'Quarterly plan with added benefits',
   '["Gym Access", "Locker Room", "All Equipment", "1 Personal Training Session"]'),
  ('Premium',  6, 4499.00, 'Semi-annual premium membership',
   '["Gym Access", "Locker Room", "All Equipment", "5 Personal Training Sessions", "Diet Consultation"]'),
  ('Elite',   12, 7999.00, 'Annual elite membership with full benefits',
   '["Gym Access", "Locker Room", "All Equipment", "Unlimited Personal Training", "Diet Consultation", "Sauna Access", "Guest Passes (2)"]');

-- Memberships
INSERT INTO memberships (member_id, plan_id, start_date, expiry_date, status) VALUES
  (1, 3, '2026-09-01', '2027-02-28', 'active'),
  (2, 2, '2026-09-01', '2026-11-30', 'active'),
  (3, 1, '2026-09-01', '2026-09-30', 'active');

-- Attendance (last 7 days for demo)
INSERT INTO attendance (member_id, attendance_date, check_in_time, check_out_time, status) VALUES
  (1, CURDATE() - INTERVAL 6 DAY, '06:30:00', '08:00:00', 'present'),
  (1, CURDATE() - INTERVAL 5 DAY, '07:00:00', '08:30:00', 'present'),
  (1, CURDATE() - INTERVAL 4 DAY, '06:45:00', '08:15:00', 'present'),
  (1, CURDATE() - INTERVAL 2 DAY, '07:15:00', '09:00:00', 'present'),
  (1, CURDATE() - INTERVAL 1 DAY, '06:30:00', '08:00:00', 'present'),
  (2, CURDATE() - INTERVAL 5 DAY, '08:00:00', '09:30:00', 'present'),
  (2, CURDATE() - INTERVAL 3 DAY, '08:15:00', '09:45:00', 'present'),
  (2, CURDATE() - INTERVAL 1 DAY, '08:00:00', '09:30:00', 'present'),
  (3, CURDATE() - INTERVAL 4 DAY, '17:00:00', '18:30:00', 'present'),
  (3, CURDATE() - INTERVAL 2 DAY, '17:30:00', '19:00:00', 'present');

-- A completed payment + receipt for demo
INSERT INTO payments (member_id, membership_id, amount, currency, payment_status, payment_method, receipt_number, razorpay_order_id, razorpay_payment_id) VALUES
  (1, 1, 4499.00, 'INR', 'PAID', 'card', 'GYM-2026-000001', 'order_demo001', 'pay_demo001');

INSERT INTO receipts (payment_id, member_id, receipt_number, file_name, local_path) VALUES
  (1, 1, 'GYM-2026-000001', 'GYM-2026-000001.pdf', 'receipts/GYM-2026-000001.pdf');
