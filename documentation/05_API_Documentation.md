# 05 - API Documentation

## Base URL
All APIs are accessed through the API Gateway at `http://localhost:8080`

## Authentication
Include JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## API Response Format

### Success
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { }
}
```

### Error
```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

## Auth APIs

### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1-555-0123",
  "password": "password123",
  "role": "CUSTOMER"
}

Response: AuthResponse with JWT token
```

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response: AuthResponse with JWT token
```

## Doctor APIs

### List All Doctors
```
GET /api/doctors

Response: List of doctor profiles with user data
```

### Get Doctor Profile
```
GET /api/doctors/{userId}

Response: Doctor profile with user data
```

### Get Specializations
```
GET /api/doctors/specializations

Response: List of specialization strings
```

## Appointment APIs

### Book Appointment
```
POST /api/appointments
Content-Type: application/json

{
  "customerId": "1",
  "doctorId": "2",
  "date": "2026-08-30",
  "timeSlot": "10:00"
}

Response: Appointment confirmation with token details
```

### Get Available Slots
```
GET /api/appointments/slots?doctorId=2&date=2026-08-30

Response: { slots: ["09:00", "09:10", ...], totalSlots: 20, bookedSlots: 5 }
```

### Cancel Appointment
```
PUT /api/appointments/{id}/cancel

Response: { success: true, message: "Appointment cancelled" }
```

## Queue APIs

### Get Queue
```
GET /api/queue/{doctorId}?date=2026-08-30

Response: List of queue tokens ordered by sequence
```

### Check In Patient
```
POST /api/queue/check-in
Content-Type: application/json

{ "tokenId": 1 }

Response: { success: true, message: "Patient checked in" }
```

### Start Consultation
```
POST /api/queue/{tokenId}/start

Response: { success: true, message: "Consultation started" }
```

### Complete Consultation
```
POST /api/queue/{tokenId}/complete

Response: { success: true, message: "Consultation completed" }
```

## Medical Record APIs

### Create Record
```
POST /api/medical-records
Content-Type: application/json

{
  "patientId": 1,
  "appointmentId": 10,
  "symptoms": "Chest pain",
  "diagnosis": "Mild angina",
  "medicines": [
    { "name": "Aspirin", "dosage": "75mg", "duration": "30 days" }
  ],
  "notes": "Follow up in 2 weeks",
  "recommendations": "Avoid strenuous activity"
}
```

### Get Patient Records
```
GET /api/medical-records/patient/{patientId}

Response: List of medical records
```

## Notification APIs

### Get Notifications
```
GET /api/notifications/{userId}

Response: List of notifications
```

### Mark as Read
```
PUT /api/notifications/{notificationId}/read?userId=1

Response: { success: true }
```

## Swagger
Each service exposes Swagger UI at:
- Auth: http://localhost:8081/swagger-ui.html
- User: http://localhost:8082/swagger-ui.html
- Appointment: http://localhost:8083/swagger-ui.html
