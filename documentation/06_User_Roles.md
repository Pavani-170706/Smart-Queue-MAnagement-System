# 06 - User Roles

## Role Hierarchy

```
ADMIN > RECEPTIONIST > DOCTOR > CUSTOMER
```

## Role Permissions

### CUSTOMER (Patient)
- Register and login
- Search doctors
- Book appointments (max 2 days advance)
- View token status
- View appointment history
- View medical records
- Receive notifications
- Manage profile

### DOCTOR
- Login
- View today's queue
- Start consultation
- Complete consultation
- Create medical records
- View patient records
- View notifications
- Manage profile

### RECEPTIONIST
- Login
- Check in patients
- Manage queue (skip, cancel tokens)
- View all appointments
- View notifications
- Manage profile

### ADMIN
- Full system access
- Manage staff (CRUD)
- Manage doctor profiles
- View all customers
- View system statistics
- Access settings
- Manage profile

## Frontend Routes by Role

| Role | Dashboard | Routes |
|------|-----------|--------|
| CUSTOMER | /dashboard | /doctors, /book-appointment, /token-status, /appointments, /history, /medical-records |
| DOCTOR | /doctor | /doctor/queue, /doctor/patients |
| RECEPTIONIST | /receptionist | /receptionist/checkin, /receptionist/queue |
| ADMIN | /admin | /admin/staff, /admin/doctors, /admin/customers |

## API Access by Role

| Endpoint | Customer | Doctor | Receptionist | Admin |
|----------|----------|--------|--------------|-------|
| GET /doctors | ✓ | ✓ | ✓ | ✓ |
| POST /appointments | ✓ | ✗ | ✓ | ✓ |
| GET /queue/{id} | ✗ | ✓ | ✓ | ✓ |
| POST /queue/check-in | ✗ | ✗ | ✓ | ✓ |
| POST /medical-records | ✗ | ✓ | ✗ | ✗ |
| GET /admin/customers | ✗ | ✗ | ✗ | ✓ |
| POST /admin/staff | ✗ | ✗ | ✗ | ✓ |
