# Smart Hospital Queue Management System (MedQueue)

A complete B.Tech semester project — a microservices-based hospital queue management system built with Java Spring Boot, React.js, MySQL, and Docker.

## Architecture

```
React Frontend → API Gateway → Microservices → MySQL Databases
                                    ↓
                              Eureka Server (Service Discovery)
```

## Microservices

| Service | Port | Database | Description |
|---------|------|----------|-------------|
| Eureka Server | 8761 | — | Service discovery |
| API Gateway | 8080 | — | Route + JWT auth filter |
| Auth Service | 8081 | qms_auth_db | Registration, login, JWT |
| User/Staff Service | 8082 | qms_user_db | Users, doctor profiles |
| Appointment Service | 8083 | qms_appointment_db | Book, cancel, manage |
| Queue Service | 8084 | qms_queue_db | Token gen, queue management |
| Medical Record Service | 8085 | qms_medical_db | Records, medicines |
| Notification Service | 8086 | qms_notification_db | In-app notifications |
| React Frontend | 3000 | — | SPA with role-based routing |

## Roles

- **Customer** — Book appointments, view tokens, access records
- **Doctor** — View queue, start/complete consultations
- **Receptionist** — Patient check-in, queue management
- **Admin** — Staff/customer/doctor management, system overview

## Tech Stack

- **Backend**: Java 21, Spring Boot 3.2, Spring Cloud 2023.0, Eureka, Gateway, OpenFeign, Spring Security, JWT, WebSocket
- **Frontend**: React 18, JavaScript, Bootstrap 5, React Router 6, Axios
- **Database**: MySQL 8
- **Build**: Maven, npm
- **Containerization**: Docker, Docker Compose
- **Testing**: JUnit, Postman

## Quick Start (Docker)

```powershell
# Build and start everything using Docker
docker compose build --no-cache
docker compose up -d

# Check service status
docker compose ps
```

**Access:**
- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- Eureka Dashboard: http://localhost:8761

## Quick Start (Local Development)

### Prerequisites
- Java 21
- Maven 3.9+
- Node.js 18+
- MySQL 8

### 1. Setup MySQL
```bash
mysql -u root -p < mysql/init/01-init-databases.sql
```

### 2. Start Services (in order)
```bash
# Terminal 1: Eureka Server
cd eureka-server && mvn spring-boot:run

# Terminal 2: API Gateway
cd api-gateway && mvn spring-boot:run

# Terminal 3: Auth Service
cd auth-service && mvn spring-boot:run

# Terminal 4: User Service
cd user-service && mvn spring-boot:run

# Terminal 5: Appointment Service
cd appointment-service && mvn spring-boot:run

# Terminal 6: Queue Service
cd queue-service && mvn spring-boot:run

# Terminal 7: Medical Record Service
cd medical-service && mvn spring-boot:run

# Terminal 8: Notification Service
cd notification-service && mvn spring-boot:run
```

### 3. Start Frontend
```bash
cd frontend
npm install
npm start
```

### 4. Open
- Frontend: http://localhost:3000
- Eureka: http://localhost:8761

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@qms.com | password123 |
| Doctor | doctor@qms.com | password123 |
| Receptionist | receptionist@qms.com | password123 |
| Customer | customer@qms.com | password123 |

## Features

- **JWT Authentication** with Spring Security + BCrypt
- **Role-based authorization** (Customer, Doctor, Receptionist, Admin)
- **Doctor search** by name, specialization, department
- **Appointment booking** with 2-day advance limit
- **Token generation** with unique daily numbers (C-001, N-001)
- **Queue management** with real-time status tracking
- **Waiting time** = People Before You × Avg Consultation Time
- **Medical records** with symptoms, diagnosis, medicines
- **In-app notifications** via WebSocket
- **Automatic appointment reminder** 10 minutes before the scheduled slot
- **Automatic missed-appointment rescheduling** once, with a fresh queue token and reminder reset
- **Automatic cancellation** after the rescheduled appointment is missed again
- **Admin dashboard** with full CRUD operations
- **Swagger/OpenAPI** at each service's `/swagger-ui.html`

## API Endpoints

### Auth (via Gateway :8080)
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login (returns JWT)
- `GET /api/auth/me` — Current user

### Doctors
- `GET /api/doctors` — List all active doctors
- `GET /api/doctors/{userId}` — Doctor profile
- `GET /api/doctors/specializations` — All specializations
- `GET /api/doctors/departments` — All departments

### Appointments
- `POST /api/appointments` — Book appointment
- `GET /api/appointments/my/{customerId}` — My appointments
- `PUT /api/appointments/{id}/cancel` — Cancel
- `GET /api/appointments/slots` — Available slots
- `GET /api/appointments/doctor/{doctorId}` — Doctor's appointments
- `GET /api/appointments/all` — All (admin)

### Queue
- `GET /api/queue/{doctorId}` — Queue for doctor
- `POST /api/queue/check-in` — Check in patient
- `POST /api/queue/{tokenId}/start` — Start consultation
- `POST /api/queue/{tokenId}/complete` — Complete consultation
- `GET /api/queue/status/{appointmentId}` — Token status

### Medical Records
- `POST /api/medical-records` — Create record
- `GET /api/medical-records/patient/{patientId}` — Patient records
- `GET /api/medical-records/doctor/{doctorId}` — Doctor records

### Notifications
- `GET /api/notifications/{userId}` — User notifications
- `PUT /api/notifications/{id}/read` — Mark as read
- `PUT /api/notifications/{userId}/read-all` — Mark all read

## Project Structure

The runnable React application is under `frontend/`. The repository root is the Maven multi-module backend/Docker Compose root; there is no separate root Vite application.


```
smart-hospital-qms/
├── pom.xml                    # Parent POM
├── docker-compose.yml         # Docker orchestration
├── mysql/init/                # DB initialization
├── eureka-server/             # Service discovery
├── api-gateway/               # Spring Cloud Gateway + JWT filter
├── auth-service/              # JWT auth + registration
├── user-service/              # Users + doctor profiles
├── appointment-service/       # Appointment CRUD + OpenFeign
├── queue-service/             # Token + queue management + WebSocket
├── medical-service/           # Medical records
├── notification-service/      # Notifications + WebSocket
├── frontend/                  # React.js SPA
│   ├── src/
│   │   ├── components/        # Sidebar, Layout
│   │   ├── context/           # Auth context
│   │   ├── pages/             # All pages by role
│   │   └── services/          # Axios API layer
│   └── package.json
└── documentation/             # Project docs
```

## License

B.Tech Semester Project — Smart Hospital Queue Management System


## Automatic reminder and rescheduling

The appointment service runs two backend schedulers. No frontend timer is required.

- Reminder check: every 30 seconds.
- Reminder: sent once when an appointment is within 10 minutes of its scheduled time and is still `BOOKED`.
- Reminder delivery is persisted in `reminder_sent`, preventing duplicate reminders after service restarts.
- If a booked patient does not check in after the configured grace period (`2 × average consultation time`), Appointment Service automatically moves the appointment to the next available working slot.
- The queue token is moved to the new date/time and receives a new token number.
- The reminder flag is reset for the new appointment occurrence.
- The patient receives an in-app reschedule notification.
- If the rescheduled appointment is missed again, the appointment is cancelled and the queue token is marked `NO_SHOW`.
- Sunday is skipped during automatic rescheduling.
- Time calculations use `Asia/Kolkata`.

### Verify automation logs in PowerShell

```powershell
docker compose logs --tail=200 appointment-service
docker compose logs appointment-service | Select-String "APPOINTMENT REMINDER|APPOINTMENT RESCHEDULE|APPOINTMENT CANCELLED"
docker compose logs queue-service | Select-String "ERROR|Exception"
```

Do not use `docker compose down -v` unless you intentionally want to delete the MySQL Docker volume and all stored project data.


## Importing the doctor dataset

The sample dataset is available at `data/doctors_dataset_all_departments.csv`. Sign in as an administrator, open **Doctor Management**, select the CSV, and click **Upload and Import**. The import matches existing user records by email and updates doctor profiles on repeated imports. The 60 records across 24 departments are fictional demo data. CSV import does not create authentication passwords for doctor login accounts.
