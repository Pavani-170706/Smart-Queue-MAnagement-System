# Smart Hospital Queue Management System — Final Run Guide

## Start the complete system

Open PowerShell in the project root and run:

```powershell
docker compose build --no-cache
docker compose up -d
```

Check all services:

```powershell
docker compose ps
```

The expected services are:

- qms-mysql
- qms-eureka
- qms-gateway
- qms-auth
- qms-user
- qms-appointment
- qms-queue
- qms-medical
- qms-notification
- qms-frontend

Open:

- Frontend: http://localhost:3000
- Eureka: http://localhost:8761

## If the frontend does not start

Check:

```powershell
docker compose logs frontend --tail=100
```

The frontend now waits for the queue service container because nginx proxies `/ws` to the queue service.

## Important: login again after this version

The authentication service now synchronizes the logged-in user with the User/Staff service.

This fixes the previous situation where a doctor existed in the Auth database but was missing from the User database or had a different numeric ID.

After rebuilding, log out and log in again so the browser receives the synchronized application user ID.

## Doctor registration

A new doctor registration now creates/synchronizes:

- User account
- Doctor profile
- Specialization
- Department
- Room
- Qualification

If profile fields are not supplied, safe default doctor profile values are created.

## Appointment flow

1. Login as a patient.
2. Open Find Doctors.
3. Select a doctor.
4. Select an allowed working date.
5. Select an available slot.
6. Confirm the appointment.
7. A queue token is created automatically.
8. The patient receives an appointment notification.

## Doctor flow

1. Login as a doctor.
2. Open Doctor Dashboard.
3. Today's appointments and queue are loaded using the synchronized doctor ID.
4. Open Doctor Queue.
5. A checked-in/waiting patient can be started.
6. Complete the consultation.
7. Open Patient Records.
8. Select the patient.
9. View medical history.
10. Add symptoms, diagnosis, notes, recommendations and follow-up date.
11. Add medicines with name, dosage and duration.
12. Save the medical record.

## Queue status synchronization

Queue actions now synchronize appointment status:

- Check-in → CHECKED_IN
- Start consultation → IN_CONSULTATION
- Complete → COMPLETED
- Cancel → CANCELLED

## Clean database reset (optional)

Only use this if you want to remove all current test data and reload the SQL seed data:

```powershell
docker compose down -v
docker compose up -d --build
```

This deletes the Docker MySQL volume and all current project data.


## Automatic appointment reminder

Appointment Service runs the reminder scheduler in the backend.

- The scheduler checks every 30 seconds.
- A `BOOKED` appointment receives one in-app `Appointment Reminder` notification 10 minutes before its slot.
- Reminder delivery is persisted so a service restart does not send the same reminder again.
- The reminder state is reset automatically when the appointment is rescheduled.

## Automatic missed-appointment rescheduling

- A `BOOKED` appointment that is not checked in within the configured grace period is automatically rescheduled once.
- The default grace period is `2 × the doctor's average consultation time`.
- The system searches for the next available working slot and skips Sunday.
- The queue token is updated to the new date/time and token number.
- The customer receives an `Appointment Postponed` or `Appointment Rescheduled` notification.
- The reminder state is reset for the new slot.
- If the rescheduled appointment is missed again, Appointment Service cancels it and the queue token is marked `NO_SHOW`.

The automatic missed-appointment flow is intentionally owned by Appointment Service. Queue Service does not cancel a missed `BOOKED` patient after other patients complete, because that would bypass the one-time automatic reschedule.

## Verify

```powershell
docker compose logs --tail=200 appointment-service
docker compose logs appointment-service | Select-String "APPOINTMENT REMINDER|APPOINTMENT RESCHEDULE|APPOINTMENT CANCELLED"
docker compose logs queue-service | Select-String "ERROR|Exception"
```
