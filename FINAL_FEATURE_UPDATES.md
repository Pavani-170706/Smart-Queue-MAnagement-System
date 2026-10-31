# Smart Queue System - Feature Updates

## Included changes

1. **Sunday weekly off**
   - Doctors are available Monday through Saturday.
   - Sunday is blocked by the appointment backend.
   - The patient booking screen hides Sunday from the selectable booking dates.
   - Doctor profile defaults and seed data use Monday-Saturday.

2. **Doctor appointment calendar**
   - Added `Doctor > Appointments Calendar`.
   - Doctors can move between months and select any date.
   - Previous, current, and upcoming appointments can be viewed.
   - Appointment days show an appointment count.
   - The live queue remains separate under `Today's Queue`.

3. **Admin-created doctor/receptionist accounts**
   - Admin can create a doctor or receptionist directly from Staff Management.
   - Doctor creation accepts name, email, phone, password, department, specialization, qualification, and room.
   - Receptionist creation accepts name, email, phone, and password.
   - The authentication account and user/staff record are created together.
   - Doctors receive a doctor profile automatically.
   - The created staff member can log in immediately and does not need to register again.

## Run

From the project root:

```powershell
docker compose down
docker compose up -d --build
docker compose ps
```

Open:

`http://localhost:3000`

## Important test flow

- Patient: select Saturday and confirm that Saturday is bookable when it is within the booking window.
- Patient: confirm Sunday is not bookable.
- Doctor: use **Appointments Calendar** to select the date on which a patient booked an appointment.
- Admin: create a doctor with a new email/password, then log out and log in with that account.
- Admin: create a receptionist with a new email/password, then log in with that account.


## Queue notification and estimated-time update

- When a doctor starts a consultation, the next active patient receives a real-time `Your turn is next` notification and it is also stored in the notification database.
- A patient who remains `BOOKED` (does not check in) is handled by Appointment Service's scheduled missed-appointment flow.
- The first missed appointment is automatically rescheduled once to the next available working slot.
- The reminder state is reset for the new slot and the customer receives a reschedule notification.
- If the rescheduled appointment is missed again, the appointment is cancelled and its queue token becomes `NO_SHOW`.
- Estimated waiting time is calculated from the number of active patients ahead multiplied by the doctor's average consultation time.
- The customer token screen shows people before, estimated wait, and estimated turn time.
- Queue updates remain real-time for doctor and receptionist screens through the existing WebSocket queue channel.
