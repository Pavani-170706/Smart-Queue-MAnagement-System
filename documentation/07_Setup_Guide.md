# 07 - Setup Guide

## Prerequisites

- **Java 21** (JDK)
- **Maven 3.9+**
- **Node.js 18+** and npm
- **MySQL 8**
- **Docker** and **Docker Compose** (optional, for containerized deployment)
- **Git**

## Option 1: Docker Compose (Recommended)

```bash
# Clone the project
git clone https://github.com/Pavani-170706/Smart-Queue-System.git
cd Smart-Queue-System

# Start everything
docker compose up --build
```

**Access:**
- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- Eureka Dashboard: http://localhost:8761

## Option 2: Local Development

### Step 1: Setup MySQL

```bash
mysql -u root -p < mysql/init/01-init-databases.sql
```

### Step 2: Start Eureka Server

```bash
cd eureka-server
mvn spring-boot:run
```
Wait for "Started EurekaServerApplication" message.

### Step 3: Start API Gateway

```bash
cd api-gateway
mvn spring-boot:run
```

### Step 4: Start Auth Service

```bash
cd auth-service
mvn spring-boot:run
```

### Step 5: Start User Service

```bash
cd user-service
mvn spring-boot:run
```

### Step 6: Start Appointment Service

```bash
cd appointment-service
mvn spring-boot:run
```

### Step 7: Start Queue Service

```bash
cd queue-service
mvn spring-boot:run
```

### Step 8: Start Medical Record Service

```bash
cd medical-service
mvn spring-boot:run
```

### Step 9: Start Notification Service

```bash
cd notification-service
mvn spring-boot:run
```

### Step 10: Start Frontend

```bash
cd frontend
npm install
npm start
```

## Verify

1. Open http://localhost:8761 — Eureka dashboard should show all services
2. Open http://localhost:3000 — React app should load
3. Register a new account and login

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@qms.com | password123 |
| Doctor | doctor@qms.com | password123 |
| Receptionist | receptionist@qms.com | password123 |
| Customer | customer@qms.com | password123 |

## Troubleshooting

- **Service won't start**: Check MySQL is running and databases are created
- **Port conflict**: Ensure ports 8761, 8080-8086, 3000 are free
- **Connection refused**: Services need time to start; wait 30 seconds
- **Docker build fails**: Run `docker compose down` then `docker compose up --build`
