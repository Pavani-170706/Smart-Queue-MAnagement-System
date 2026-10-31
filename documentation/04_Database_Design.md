# 04 - Database Design

## ER Diagram

```
qms_auth_db:
┌─────────────────────┐
│       users          │
├─────────────────────┤
│ id (PK)             │
│ full_name            │
│ email (UNIQUE)       │
│ phone                │
│ password (BCrypt)    │
│ role (ENUM)          │
│ date_of_birth        │
│ gender               │
│ address              │
│ is_active            │
│ created_at           │
│ updated_at           │
└─────────────────────┘

qms_user_db:
┌─────────────────────┐      ┌─────────────────────┐
│       users          │      │   doctor_profiles    │
├─────────────────────┤      ├─────────────────────┤
│ id (PK)             │◄─────│ user_id (FK)         │
│ full_name            │      │ specialization       │
│ email                │      │ department           │
│ phone                │      │ room                 │
│ role                 │      │ experience           │
│ is_active            │      │ working_days         │
└─────────────────────┘      │ working_hours_start  │
                              │ working_hours_end    │
                              │ max_daily_appointments│
                              │ average_consultation │
                              │ is_active            │
                              └─────────────────────┘

qms_appointment_db:
┌─────────────────────────┐
│       appointments       │
├─────────────────────────┤
│ id (PK)                 │
│ customer_id              │
│ doctor_id                │
│ doctor_profile_id        │
│ appointment_date         │
│ time_slot                │
│ token_number             │
│ status (ENUM)            │
│ created_at               │
│ updated_at               │
└─────────────────────────┘

qms_queue_db:
┌─────────────────────────┐
│      queue_tokens        │
├─────────────────────────┤
│ id (PK)                 │
│ appointment_id           │
│ customer_id              │
│ doctor_id                │
│ token_date               │
│ token_number             │
│ sequence_number          │
│ status (ENUM)            │
│ checked_in_at            │
│ consultation_started_at  │
│ consultation_ended_at    │
│ created_at               │
└─────────────────────────┘

qms_medical_db:
┌─────────────────────────┐      ┌─────────────────────┐
│    medical_records       │      │      medicines       │
├─────────────────────────┤      ├─────────────────────┤
│ id (PK)                 │◄─────│ medical_record_id(FK)│
│ patient_id               │      │ name                 │
│ doctor_id                │      │ dosage               │
│ appointment_id           │      │ duration             │
│ record_date              │      └─────────────────────┘
│ symptoms                 │
│ diagnosis                │
│ notes                    │
│ recommendations          │
│ follow_up_date           │
└─────────────────────────┘

qms_notification_db:
┌─────────────────────────┐
│      notifications       │
├─────────────────────────┤
│ id (PK)                 │
│ user_id                  │
│ title                    │
│ message                  │
│ type (ENUM)              │
│ is_read                  │
│ appointment_id           │
│ created_at               │
└─────────────────────────┘
```

## Token Status Flow

```
BOOKED → CHECKED_IN → WAITING → IN_CONSULTATION → COMPLETED
   │                    │              │
   └──── CANCELLED ─────┴──── SKIPPED ┘
```

## Appointment Status Flow

```
BOOKED → CHECKED_IN → IN_CONSULTATION → COMPLETED
   │                                          │
   └───────────── CANCELLED ──────────────────┘
```
