# 08 - Testing

## Testing Strategy

### Backend Testing (JUnit)

#### Auth Service Tests
```java
@SpringBootTest
class AuthServiceTest {
    @Test
    void testRegistration() { ... }
    
    @Test
    void testLogin() { ... }
    
    @Test
    void testInvalidLogin() { ... }
    
    @Test
    void testDuplicateEmail() { ... }
    
    @Test
    void testPasswordHashing() { ... }
}
```

#### Appointment Service Tests
```java
@SpringBootTest
class AppointmentServiceTest {
    @Test
    void testBookAppointment() { ... }
    
    @Test
    void testDoctorUnavailable() { ... }
    
    @Test
    void testInvalidDate() { ... }
    
    @Test
    void testCapacityExceeded() { ... }
    
    @Test
    void testCustomerConflict() { ... }
}
```

#### Queue Service Tests
```java
@SpringBootTest
class QueueServiceTest {
    @Test
    void testTokenGeneration() { ... }
    
    @Test
    void testCheckIn() { ... }
    
    @Test
    void testStartConsultation() { ... }
    
    @Test
    void testCompleteConsultation() { ... }
    
    @Test
    void testWaitingTimeCalculation() { ... }
}
```

### Run Tests

```bash
# Run all tests for a service
cd auth-service
mvn test

# Run specific test
mvn test -Dtest=AuthServiceTest

# Run all tests across all services
mvn test -pl auth-service,user-service,appointment-service,queue-service,medical-service,notification-service
```

## API Testing (Postman)

### Import Postman Collection

1. Open Postman
2. Click "Import" → "File"
3. Select `postman/Smart-Hospital-QMS.postman_collection.json`

### Setup Variables
- `baseUrl`: http://localhost:8080
- `jwtToken`: (auto-populated after login)

### Test Flows

#### Flow 1: Customer Registration & Booking
1. POST /api/auth/register (customer)
2. Login → copy token
3. GET /api/doctors
4. GET /api/appointments/slots
5. POST /api/appointments
6. Verify token in response

#### Flow 2: Doctor Queue Management
1. Login as doctor
2. GET /api/queue/{doctorId}
3. POST /api/queue/{tokenId}/start
4. POST /api/queue/{tokenId}/complete

#### Flow 3: Receptionist Check-in
1. Login as receptionist
2. GET /api/queue/{doctorId}
3. POST /api/queue/check-in

### Test Cases

| # | Test Case | Expected Result |
|---|-----------|-----------------|
| 1 | Register new customer | Success + JWT |
| 2 | Login with valid credentials | Success + JWT |
| 3 | Login with invalid password | 400 Error |
| 4 | Book appointment (valid) | Token generated |
| 5 | Book appointment (doctor unavailable) | Error message |
| 6 | Book appointment (past date) | Error message |
| 7 | Cancel appointment | Status → CANCELLED |
| 8 | Check in patient | Status → WAITING |
| 9 | Start consultation | Status → IN_CONSULTATION |
| 10 | Complete consultation | Status → COMPLETED |
| 11 | Get medical records | List of records |
| 12 | Get notifications | List of notifications |

## Frontend Testing

### Manual Testing Checklist

- [ ] Landing page loads correctly
- [ ] Registration form validates inputs
- [ ] Login redirects to correct dashboard
- [ ] Customer can search doctors
- [ ] Customer can book appointment
- [ ] Customer can view token status
- [ ] Doctor can view queue
- [ ] Doctor can start/complete consultation
- [ ] Receptionist can check in patients
- [ ] Admin can manage staff
- [ ] Notifications appear in real-time
- [ ] Mobile responsive layout works
