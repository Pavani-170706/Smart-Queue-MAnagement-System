# 01 - Project Overview

## Smart Hospital Queue Management System (MedQueue)

### Problem Statement
Hospitals face long waiting times, poor queue management, and lack of real-time communication between patients and staff. Patients have no visibility into queue status or estimated wait times.

### Solution
MedQueue is a web-based Smart Hospital Queue Management System that digitizes the entire patient flow — from appointment booking to consultation completion — with real-time queue tracking and instant notifications.

### Objectives
1. Allow patients to book appointments online (up to 2 days in advance)
2. Generate unique daily tokens for each appointment
3. Provide real-time queue status with estimated waiting time
4. Enable doctors to manage their daily queue digitally
5. Allow receptionists to check in patients efficiently
6. Give administrators full control over staff and system management
7. Maintain digital medical records for completed consultations

### Key Features
- **Patient Module**: Doctor search, appointment booking, token tracking, medical records
- **Doctor Module**: Today's queue, patient consultation, medical record creation
- **Receptionist Module**: Patient check-in, queue management
- **Admin Module**: Staff management, doctor management, customer management

### Technology Stack
- **Backend**: Java 21, Spring Boot 3.2, Spring Cloud, Eureka, Gateway, OpenFeign
- **Security**: Spring Security, JWT, BCrypt
- **Database**: MySQL 8 (separate databases per service)
- **Frontend**: React.js 18, JavaScript, Bootstrap 5
- **Real-time**: Spring WebSocket
- **Build**: Maven, npm
- **Containerization**: Docker, Docker Compose

### Project Type
B.Tech Semester Project — API & Microservices Architecture
