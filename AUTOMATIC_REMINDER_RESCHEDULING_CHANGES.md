# Automatic reminder / rescheduling / cancellation - changes

- Reminder default is now 30 minutes before the slot (qms.appointment-reminder-minutes, env QMS_APPOINTMENT_REMINDER_MINUTES).
- New appointment columns (added by ddl-auto=update, no data loss): last_rescheduled_at, last_reschedule_message, cancellation_reason.
- Missed-appointment job also picks up BOOKED appointments from earlier days (e.g. after downtime).
- Booking: rejects past slots and slots already taken by anyone, token numbers use max(sequence)+1 under a per-doctor lock, appointment is rolled back if the queue token cannot be created (2 attempts).
- Automatic reschedule/cancel store the message/reason; customer History and My Appointments show friendly labels.
- docker-compose: JAVA_TOOL_OPTIONS=-Duser.timezone=Asia/Kolkata for appointment, queue, notification services.
Run: docker compose up --build   (never use `docker compose down -v`)
