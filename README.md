# 🏥 MedQueue – Smart Hospital Queue Management System

<p align="center">

**A Microservices-Based Hospital Appointment & Queue Management Platform**

*Smarter Appointments. Faster Queues. Better Patient Experiences.*

</p>

---

## 📌 Project Overview

**MedQueue** is a B.Tech semester project designed to simplify hospital appointment scheduling and patient queue management.

Built using a microservices architecture, the system connects patients, doctors, receptionists, and administrators through a centralized platform. It helps hospitals manage appointments, generate queue tokens, track waiting times, maintain medical records, and send real-time notifications.

The platform focuses on improving hospital workflow, reducing manual queue management, and providing a smoother experience for patients and healthcare staff.

## ✨ Key Highlights

- 🔐 Secure authentication using JWT and Spring Security
- 👥 Role-based access for four user types
- 🩺 Doctor search and appointment booking
- 🎫 Automatic daily queue token generation
- ⏱️ Real-time queue status and waiting-time estimation
- 📋 Digital medical records and medicine management
- 🔔 WebSocket-based in-app notifications
- 📅 Automatic appointment reminders and missed-appointment rescheduling
- 📊 Admin dashboard with management operations
- 🐳 Docker-based service deployment

---

## 🏗️ System Architecture

MedQueue follows a **Microservices Architecture**, where each service handles a specific business responsibility and communicates with other services through APIs.

```text
                   ┌──────────────────────┐
                   │    React Frontend    │
                   │      Port 3000       │
                   └──────────┬───────────┘
                              │
                   ┌──────────▼───────────┐
                   │     API Gateway      │
                   │      Port 8080       │
                   └──────────┬───────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
    ┌─────▼─────┐      ┌──────▼──────┐     ┌──────▼──────┐
    │   Auth    │      │    User     │     │ Appointment │
    │  Service  │      │   Service   │     │   Service   │
    └───────────┘      └─────────────┘     └─────────────┘
          │                   │                   │
    ┌─────▼─────┐      ┌──────▼──────┐     ┌──────▼──────┐
    │   Queue   │      │   Medical   │     │Notification │
    │  Service  │      │   Service   │     │   Service   │
    └───────────┘      └─────────────┘     └─────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Eureka Server   │
                    │ Service Discovery │
                    └───────────────────┘
```

### Microservices Overview

| Service | Port | Responsibility |
|---|---:|---|
| Eureka Server | 8761 | Service discovery |
| API Gateway | 8080 | Request routing and JWT authentication filter |
| Auth Service | 8081 | Registration, login and JWT |
| User/Staff Service | 8082 | User and doctor profile management |
| Appointment Service | 8083 | Appointment scheduling and management |
| Queue Service | 8084 | Token generation and queue management |
| Medical Record Service | 8085 | Medical records and medicines |
| Notification Service | 8086 | In-app notifications |
| React Frontend | 3000 | User interface |

---

## 👤 User Roles & Responsibilities

MedQueue supports four different roles, each with dedicated functionality.

| Role | Main Responsibilities |
|---|---|
| 🧑 Customer | Register, search doctors, book appointments, view tokens and medical records |
| 🩺 Doctor | View patient queues and manage consultations |
| 🧑‍💼 Receptionist | Check in patients and manage queues |
| 👨‍💻 Admin | Manage customers, doctors, staff and system operations |

---

## 🛠️ Technology Stack

### Backend
- Java 21
- Spring Boot 3.2
- Spring Cloud 2023.0
- Spring Security
- Spring Cloud Gateway
- Netflix Eureka
- OpenFeign
- JWT Authentication
- WebSocket

### Frontend
- React.js 18
- JavaScript
- Bootstrap 5
- React Router 6
- Axios

### Database & Tools
- MySQL 8
- Maven
- npm
- Docker
- Docker Compose
- JUnit
- Postman

---

## 🚀 Getting Started

You can run the complete project using Docker or start each service individually for local development.

### Option 1: Run Using Docker

**Prerequisites:** Docker Desktop installed and running.

Open the project root directory in the terminal and execute:

```powershell
# Build all services
docker compose build --no-cache

# Start all containers
docker compose up -d

# Check running services
docker compose ps
```

### Application Access

| Application | URL |
|---|---|
| 🌐 Frontend | http://localhost:3000 |
| 🔗 API Gateway | http://localhost:8080 |
| 🔍 Eureka Dashboard | http://localhost:8761 |

### Option 2: Local Development

**Prerequisites:**
- Java 21
- Maven 3.9+
- Node.js 18+
- MySQL 8

**Step 1 – Configure MySQL**

```bash
mysql -u root -p < mysql/init/01-init-databases.sql
```

**Step 2 – Start Backend Services**

Start the following services in separate terminals, in the specified order:

| Terminal | Service | Command |
|---|---|---|
| 1 | Eureka Server | `cd eureka-server && mvn spring-boot:run` |
| 2 | API Gateway | `cd api-gateway && mvn spring-boot:run` |
| 3 | Auth Service | `cd auth-service && mvn spring-boot:run` |
| 4 | User Service | `cd user-service && mvn spring-boot:run` |
| 5 | Appointment Service | `cd appointment-service && mvn spring-boot:run` |
| 6 | Queue Service | `cd queue-service && mvn spring-boot:run` |
| 7 | Medical Service | `cd medical-service && mvn spring-boot:run` |
| 8 | Notification Service | `cd notification-service && mvn spring-boot:run` |

**Step 3 – Start React Frontend**

```bash
cd frontend
npm install
npm start
```

**Step 4 – Open the Application**

Visit http://localhost:3000 in your browser.

---

## 🔑 Demo Accounts

The following sample accounts are provided for demonstration purposes.

| Role | Email | Password |
|---|---|---|
| Admin | admin@qms.com | password123 |
| Doctor | doctor@qms.com | password123 |
| Receptionist | receptionist@qms.com | password123 |
| Customer | customer@qms.com | password123 |

*These are demonstration credentials for the semester project.*

---

## ⚡ Core Features

### 1. Authentication & Authorization
- User registration and login
- JWT-based authentication
- BCrypt password encryption
- Role-based access control

### 2. Doctor Management
- Search doctors by name
- Filter by specialization and department
- View doctor profiles
- Import doctor information using CSV files

### 3. Appointment Management
- Book hospital appointments
- View scheduled appointments
- Cancel appointments
- Check available appointment slots
- Two-day advance booking limit

### 4. Smart Queue Management
- Generate unique daily queue tokens
- Separate token prefixes (C-001, N-001)
- Patient check-in
- Start and complete consultations
- Real-time queue status tracking

### 5. Waiting-Time Estimation

The estimated waiting time is calculated using:

**Waiting Time = People Before You × Average Consultation Time**

### 6. Medical Records
- Create and view patient medical records
- Store symptoms and diagnosis
- Maintain medicine details
- Access patient medical history

### 7. Real-Time Notifications
- WebSocket-based communication
- In-app notification delivery
- Mark individual notifications as read
- Mark all notifications as read

### 8. Automatic Appointment Reminder & Rescheduling

The Appointment Service includes two backend schedulers:

- Sends an appointment reminder 10 minutes before the scheduled time.
- Checks for missed appointments every 30 seconds.
- Automatically reschedules a missed appointment once.
- Generates a fresh queue token for the rescheduled slot.
- Resets the reminder flag for the new appointment.
- Sends an in-app rescheduling notification.
- Cancels the appointment if the rescheduled appointment is missed again.
- Skips Sundays during automatic rescheduling.
- Uses `Asia/Kolkata` for time calculations.

No frontend timer is required for these automated operations.

---

## 🔌 API Documentation

All endpoints listed below are accessed through the API Gateway on port `8080`.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Authenticate and receive JWT |
| GET | `/api/auth/me` | Get current user |

### Doctor Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/doctors` | List active doctors |
| GET | `/api/doctors/{userId}` | Get doctor profile |
| GET | `/api/doctors/specializations` | List specializations |
| GET | `/api/doctors/departments` | List departments |

### Appointment Management

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/appointments` | Book appointment |
| GET | `/api/appointments/my/{customerId}` | View customer appointments |
| PUT | `/api/appointments/{id}/cancel` | Cancel appointment |
| GET | `/api/appointments/slots` | Get available slots |
| GET | `/api/appointments/doctor/{doctorId}` | View doctor's appointments |
| GET | `/api/appointments/all` | Get all appointments (Admin) |

### Queue Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/queue/{doctorId}` | Get doctor's queue |
| POST | `/api/queue/check-in` | Check in patient |
| POST | `/api/queue/{tokenId}/start` | Start consultation |
| POST | `/api/queue/{tokenId}/complete` | Complete consultation |
| GET | `/api/queue/status/{appointmentId}` | Get token status |

### Medical Records

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/medical-records` | Create medical record |
| GET | `/api/medical-records/patient/{patientId}` | Get patient records |
| GET | `/api/medical-records/doctor/{doctorId}` | Get doctor records |

### Notifications

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications/{userId}` | Get user notifications |
| PUT | `/api/notifications/{id}/read` | Mark notification as read |
| PUT | `/api/notifications/{userId}/read-all` | Mark all notifications as read |

**API Testing:** Postman  
**Interactive API Documentation:** Swagger/OpenAPI at each service's `/swagger-ui.html`.

---

## 📁 Project Structure

The project uses a Maven multi-module backend structure with a separate React frontend.

```text
Smart-Queue-System/
│
├── pom.xml
├── docker-compose.yml
│
├── mysql/
│   └── init/
│       ├── 01-init-databases.sql
│       └── 02-seed-data.sql
│
├── eureka-server/
├── api-gateway/
├── auth-service/
├── user-service/
├── appointment-service/
├── queue-service/
├── medical-service/
├── notification-service/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
│
├── data/
│   └── doctors_dataset_all_departments.csv
│
└── documentation/
    ├── 01_Project_Overview.md
    ├── 02_System_Architecture.md
    ├── 03_Microservices.md
    ├── 04_Database_Design.md
    ├── 05_API_Documentation.md
    ├── 06_User_Roles.md
    ├── 07_Setup_Guide.md
    └── 08_Testing.md
```

---

## 🧑‍⚕️ Doctor Dataset Import

The project includes a sample doctor dataset containing **60 fictional records across 24 departments**.

To import the dataset:

1. Sign in using an administrator account.
2. Navigate to **Doctor Management**.
3. Select the CSV dataset.
4. Click **Upload and Import**.

The import process matches existing user records by email and updates doctor profiles during repeated imports.

**Note:** CSV import does not create authentication passwords for doctor login accounts.

---

## 🧪 Monitoring & Troubleshooting

To inspect Appointment Service logs:

```powershell
docker compose logs --tail=200 appointment-service
```

To filter reminder and rescheduling logs:

```powershell
docker compose logs appointment-service |
Select-String "APPOINTMENT REMINDER|APPOINTMENT RESCHEDULE|APPOINTMENT CANCELLED"
```

To check Queue Service errors:

```powershell
docker compose logs queue-service |
Select-String "ERROR|Exception"
```

**Important:** Avoid running `docker compose down -v` unless you intentionally want to delete the MySQL Docker volume and all stored project data.

---

## 🎯 Project Objective

The main objective of MedQueue is to demonstrate how modern web technologies and microservices architecture can be used to develop a centralized hospital queue management platform.

By integrating appointment scheduling, queue tracking, medical records, and automated notifications, the project aims to demonstrate a more organized and efficient approach to hospital workflow management.

---

## 📜 Project Information

| Detail | Information |
|---|---|
| Project Name | MedQueue – Smart Hospital Queue Management System |
| Project Type | B.Tech Semester Project |
| Architecture | Microservices |
| Backend | Java Spring Boot |
| Frontend | React.js |
| Database | MySQL |
| Deployment | Docker & Docker Compose |

## 📄 License

This project is developed for academic and educational purposes as part of a B.Tech semester project.

---

<p align="center">

**🏥 MedQueue – Making Hospital Queues Smarter!**

*Designed and developed as an academic project.*

</p>
