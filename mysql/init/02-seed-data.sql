-- Smart Hospital QMS - Seed Data
-- Password for all accounts: password123
-- BCrypt hash of "password123": $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

-- ══════════════════════════════════════════════════════════════
-- AUTH SERVICE - Seed Users
-- ══════════════════════════════════════════════════════════════
USE qms_auth_db;

INSERT IGNORE INTO users (id, full_name, email, phone, password, role, gender, address, is_active) VALUES
-- Admin
(1, 'System Admin', 'admin@qms.com', '+1-555-0100', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN', 'MALE', '100 Hospital Drive', true),
-- Doctors
(2, 'Dr. Sarah Johnson', 'doctor@qms.com', '+1-555-0201', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'DOCTOR', 'FEMALE', '101 Medical Lane', true),
(3, 'Dr. Michael Chen', 'doctor2@qms.com', '+1-555-0202', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'DOCTOR', 'MALE', '102 Health Street', true),
(4, 'Dr. Emily Rodriguez', 'doctor3@qms.com', '+1-555-0203', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'DOCTOR', 'FEMALE', '103 Wellness Ave', true),
(5, 'Dr. James Williams', 'doctor4@qms.com', '+1-555-0204', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'DOCTOR', 'MALE', '104 Clinic Road', true),
(6, 'Dr. Priya Patel', 'doctor5@qms.com', '+1-555-0205', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'DOCTOR', 'FEMALE', '105 Hospital Blvd', true),
-- Receptionists
(7, 'Lisa Thompson', 'receptionist@qms.com', '+1-555-0301', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'RECEPTIONIST', 'FEMALE', '201 Front Desk Lane', true),
(8, 'David Kim', 'receptionist2@qms.com', '+1-555-0302', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'RECEPTIONIST', 'MALE', '202 Reception Drive', true),
-- Customer
(9, 'John Smith', 'customer@qms.com', '+1-555-0401', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'CUSTOMER', 'MALE', '301 Patient Street', true);

-- ══════════════════════════════════════════════════════════════
-- USER SERVICE - Seed Users & Doctor Profiles
-- ══════════════════════════════════════════════════════════════
USE qms_user_db;

INSERT IGNORE INTO users (id, full_name, email, phone, role, is_active) VALUES
(1, 'System Admin', 'admin@qms.com', '+1-555-0100', 'ADMIN', true),
(2, 'Dr. Sarah Johnson', 'doctor@qms.com', '+1-555-0201', 'DOCTOR', true),
(3, 'Dr. Michael Chen', 'doctor2@qms.com', '+1-555-0202', 'DOCTOR', true),
(4, 'Dr. Emily Rodriguez', 'doctor3@qms.com', '+1-555-0203', 'DOCTOR', true),
(5, 'Dr. James Williams', 'doctor4@qms.com', '+1-555-0204', 'DOCTOR', true),
(6, 'Dr. Priya Patel', 'doctor5@qms.com', '+1-555-0205', 'DOCTOR', true),
(7, 'Lisa Thompson', 'receptionist@qms.com', '+1-555-0301', 'RECEPTIONIST', true),
(8, 'David Kim', 'receptionist2@qms.com', '+1-555-0302', 'RECEPTIONIST', true),
(9, 'John Smith', 'customer@qms.com', '+1-555-0401', 'CUSTOMER', true);

INSERT IGNORE INTO doctor_profiles (id, user_id, specialization, department, room, experience, bio, qualification, working_days, working_hours_start, working_hours_end, max_daily_appointments, average_consultation_time, is_active) VALUES
(1, 2, 'Cardiology', 'Cardiology Department', 'C-101', 15, 'Board-certified cardiologist with expertise in interventional cardiology.', 'MD, DM Cardiology', 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY', '09:00:00', '17:00:00', 20, 10, true),
(2, 3, 'Dermatology', 'Dermatology Department', 'D-201', 10, 'Specializing in cosmetic and medical dermatology.', 'MD, DVD Dermatology', 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY', '10:00:00', '18:00:00', 25, 8, true),
(3, 4, 'Pediatrics', 'Pediatrics Department', 'P-301', 8, 'Compassionate pediatrician with a focus on child wellness.', 'MD, DNB Pediatrics', 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY', '08:00:00', '16:00:00', 30, 7, true),
(4, 5, 'Orthopedics', 'Orthopedics Department', 'O-401', 20, 'Expert in joint replacement and sports medicine.', 'MS, MCh Orthopedics', 'MONDAY,WEDNESDAY,FRIDAY', '09:00:00', '17:00:00', 15, 15, true),
(5, 6, 'Neurology', 'Neurology Department', 'N-501', 12, 'Specialized in neurological disorders and stroke management.', 'MD, DM Neurology', 'TUESDAY,THURSDAY,FRIDAY', '10:00:00', '18:00:00', 18, 12, true);
