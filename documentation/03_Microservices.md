# 03 - Microservices

## Service Details

### 1. Eureka Server (Port 8761)
- **Purpose**: Service discovery and registration
- **Dependencies**: spring-cloud-starter-netflix-eureka-server
- **Function**: All other services register here for discovery

### 2. API Gateway (Port 8080)
- **Purpose**: Single entry point, routing, JWT validation
- **Dependencies**: spring-cloud-starter-gateway, jjwt
- **Routes**:
  - `/api/auth/**` → auth-service
  - `/api/doctors/**`, `/api/users/**`, `/api/admin/**` → user-service
  - `/api/appointments/**` → appointment-service
  - `/api/queue/**` → queue-service
  - `/api/medical-records/**` → medical-service
  - `/api/notifications/**`, `/ws/**` → notification-service

### 3. Auth Service (Port 8081)
- **Purpose**: User registration, login, JWT token generation
- **Database**: qms_auth_db
- **Dependencies**: Spring Security, BCrypt, jjwt
- **API**: POST /register, POST /login, GET /me

### 4. User/Staff Service (Port 8082)
- **Purpose**: User profiles, doctor profiles, staff management
- **Database**: qms_user_db
- **API**: CRUD for users, doctor profiles, specializations

### 5. Appointment Service (Port 8083)
- **Purpose**: Appointment booking, availability, cancellation
- **Database**: qms_appointment_db
- **Dependencies**: OpenFeign (calls User Service)
- **Features**: 2-day booking limit, capacity check, conflict detection

### 6. Queue Service (Port 8084)
- **Purpose**: Token generation, queue management, real-time updates
- **Database**: qms_queue_db
- **Dependencies**: WebSocket
- **Features**: Check-in, start/complete consultation, skip, cancel

### 7. Medical Record Service (Port 8085)
- **Purpose**: Medical records, prescriptions
- **Database**: qms_medical_db
- **API**: Create records, get by patient/doctor/appointment

### 8. Notification Service (Port 8086)
- **Purpose**: In-app notifications, WebSocket push
- **Database**: qms_notification_db
- **Dependencies**: WebSocket
- **Types**: APPOINTMENT, QUEUE, MEDICAL, SYSTEM
