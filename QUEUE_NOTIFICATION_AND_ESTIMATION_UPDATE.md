# Queue Notification, No-Show and Estimated-Time Update

## New behavior

1. When a doctor starts a consultation, the next active patient automatically receives a real-time notification:
   **Your turn is next**.
2. The notification is saved in the notification database and appears as an in-app live notification while the patient is logged in.
3. Queue actions do not directly cancel a missed `BOOKED` patient.
4. Appointment Service owns missed-appointment automation: the first missed appointment is rescheduled once; if the rescheduled appointment is missed again, it becomes `CANCELLED` and its queue token becomes `NO_SHOW`.
5. Estimated waiting time is calculated as:
   `active people before you × doctor's average consultation time`.
6. The customer's token screen displays:
   - Currently serving token
   - People before you
   - Estimated waiting time
   - Estimated turn time
7. The appointment confirmation also displays the estimated wait and estimated turn time.
8. QueueToken stores the doctor's consultation duration and appointment time so the estimate remains meaningful for future appointments.

## Important

- Existing queue records remain compatible. Older tokens without consultation duration fall back to 10 minutes.
- Existing MySQL volumes should be preserved. Hibernate `ddl-auto: update` adds the new columns automatically when the services start.
