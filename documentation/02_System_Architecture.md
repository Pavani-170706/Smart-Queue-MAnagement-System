# 02 - System Architecture

## Architecture Overview

The system follows a microservices architecture with the following flow:

```
┌─────────────┐
│   React      │
│   Frontend   │
│  (Port 3000) │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ API Gateway  │ ← JWT Authentication Filter
│ (Port 8080)  │
└──────┬──────┘
       │
       ├──────────────────┬──────────────────┬──────────────────┐
       ▼                  ▼                  ▼                  ▼
┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
│   Auth     │  │   User     │  │ Appointment│  │   Queue    │
│  Service   │  │  Service   │  │  Service   │  │  Service   │
│  (8081)    │  │  (8082)    │  │  (8083)    │  │  (8084)    │
└─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘
      │               │               │               │
      ▼               ▼               ▼               ▼
┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
│   qms_     │  │   qms_     │  │   qms_     │  │   qms_     │
│  auth_db   │  │  user_db   │  │appointment │  │  queue_db  │
└────────────┘  └────────────┘  └────────────┘  └────────────┘

       ┌──────────────────┬──────────────────┐
       ▼                  ▼                  ▼
┌────────────┐  ┌────────────┐  ┌────────────┐
│  Medical   │  │ Notification│  │   Eureka   │
│  Service   │  │  Service    │  │  Server    │
│  (8085)    │  │  (8086)     │  │  (8761)    │
└─────┬──────┘  └─────┬──────┘  └────────────┘
      │               │
      ▼               ▼
┌────────────┐  ┌────────────┐
│   qms_     │  │   qms_     │
│  medical   │  │notification│
└────────────┘  └────────────┘
```

## Design Patterns

1. **API Gateway Pattern**: Single entry point with JWT validation
2. **Service Discovery**: Netflix Eureka for dynamic service registration
3. **Database per Service**: Each microservice owns its database
4. **CQRS-inspired**: Separate read/write paths through different services
5. **Circuit Breaker Ready**: OpenFeign for service-to-service communication

## Data Flow

### Appointment Booking Flow
1. Customer → API Gateway → Appointment Service
2. Appointment Service → User Service (via OpenFeign) to verify doctor
3. Appointment Service → Queue Service to create token
4. Appointment Service → Notification Service to send notification

### Queue Management Flow
1. Receptionist checks in patient → Queue Service
2. Doctor starts consultation → Queue Service
3. Doctor saves record & completes → Queue Service + Medical Service
4. Queue Service broadcasts update via WebSocket

## Security Flow
1. Client sends credentials to Auth Service
2. Auth Service validates and returns JWT
3. API Gateway validates JWT on every request
4. User info forwarded via headers (X-User-Id, X-User-Role)
