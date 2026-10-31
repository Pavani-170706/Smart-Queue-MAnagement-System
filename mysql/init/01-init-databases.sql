-- Smart Hospital QMS - Database Initialization

-- Auth DB
CREATE DATABASE IF NOT EXISTS qms_auth_db;
USE qms_auth_db;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    role ENUM('CUSTOMER','DOCTOR','RECEPTIONIST','ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    date_of_birth DATE,
    gender ENUM('MALE','FEMALE','OTHER'),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User DB
CREATE DATABASE IF NOT EXISTS qms_user_db;
USE qms_user_db;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role ENUM('CUSTOMER','DOCTOR','RECEPTIONIST','ADMIN') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctor_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    room VARCHAR(50) NOT NULL,
    experience INT NOT NULL DEFAULT 0,
    bio TEXT,
    qualification VARCHAR(200),
    working_days VARCHAR(100) NOT NULL DEFAULT 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY',
    working_hours_start TIME NOT NULL DEFAULT '09:00:00',
    working_hours_end TIME NOT NULL DEFAULT '17:00:00',
    max_daily_appointments INT NOT NULL DEFAULT 20,
    average_consultation_time INT NOT NULL DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointment DB
CREATE DATABASE IF NOT EXISTS qms_appointment_db;
USE qms_appointment_db;

CREATE TABLE IF NOT EXISTS appointments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    doctor_profile_id BIGINT NOT NULL,
    appointment_date DATE NOT NULL,
    time_slot VARCHAR(10) NOT NULL,
    token_number VARCHAR(20),
    status ENUM('BOOKED','CHECKED_IN','IN_CONSULTATION','COMPLETED','CANCELLED') DEFAULT 'BOOKED',
    reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,
    reschedule_count INT NOT NULL DEFAULT 0,
    original_appointment_date DATE NULL,
    original_time_slot VARCHAR(10) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_appointment_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX idx_appointment_customer ON appointments(customer_id);
CREATE INDEX idx_appointment_status ON appointments(status);

-- Queue DB
CREATE DATABASE IF NOT EXISTS qms_queue_db;
USE qms_queue_db;

CREATE TABLE IF NOT EXISTS queue_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    doctor_profile_id BIGINT NOT NULL,
    token_date DATE NOT NULL,
    token_number VARCHAR(20) NOT NULL,
    appointment_time VARCHAR(10) NULL,
    sequence_number INT NOT NULL,
    consultation_minutes INT NOT NULL DEFAULT 10,
    status ENUM('BOOKED','CHECKED_IN','WAITING','IN_CONSULTATION','COMPLETED','CANCELLED','SKIPPED','NO_SHOW') DEFAULT 'BOOKED',
    checked_in_at TIMESTAMP NULL,
    consultation_started_at TIMESTAMP NULL,
    consultation_ended_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_token_doctor_date ON queue_tokens(doctor_id, token_date);
CREATE INDEX idx_token_customer ON queue_tokens(customer_id);
CREATE INDEX idx_token_status ON queue_tokens(status);

-- Medical Record DB
CREATE DATABASE IF NOT EXISTS qms_medical_db;
USE qms_medical_db;

CREATE TABLE IF NOT EXISTS medical_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    appointment_id BIGINT NOT NULL,
    record_date DATE NOT NULL,
    symptoms TEXT NOT NULL,
    diagnosis TEXT NOT NULL,
    notes TEXT,
    recommendations TEXT,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medicines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    medical_record_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    duration VARCHAR(100) NOT NULL,
    FOREIGN KEY (medical_record_id) REFERENCES medical_records(id) ON DELETE CASCADE
);

-- Notification DB
CREATE DATABASE IF NOT EXISTS qms_notification_db;
USE qms_notification_db;

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('APPOINTMENT','QUEUE','MEDICAL','SYSTEM') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    appointment_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_user ON notifications(user_id);
CREATE INDEX idx_notification_user_read ON notifications(user_id, is_read);
