package com.qms.appointment.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "doctor_id", nullable = false)
    private Long doctorId;

    @Column(name = "doctor_profile_id", nullable = false)
    private Long doctorProfileId;

    @Column(name = "appointment_date", nullable = false)
    private LocalDate appointmentDate;

    @Column(name = "time_slot", nullable = false, length = 10)
    private String timeSlot;

    @Column(name = "token_number", length = 20)
    private String tokenNumber;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Status status = Status.BOOKED;

    // Reminder state for the CURRENT appointment occurrence. Persisted so that a
    // restart never re-sends a reminder; reset to false whenever the appointment moves.
    @Builder.Default
    @Column(name = "reminder_sent", nullable = false, columnDefinition = "BIT(1) NOT NULL DEFAULT 0")
    private Boolean reminderSent = false;

    // Number of automatic reschedules already used (max 1).
    @Builder.Default
    @Column(name = "reschedule_count", nullable = false, columnDefinition = "INT NOT NULL DEFAULT 0")
    private Integer rescheduleCount = 0;

    // Slot originally booked by the patient (set on the first reschedule).
    @Column(name = "original_appointment_date")
    private LocalDate originalAppointmentDate;

    @Column(name = "original_time_slot", length = 10)
    private String originalTimeSlot;

    // When the last automatic reschedule happened and the message shown to the patient.
    @Column(name = "last_rescheduled_at")
    private LocalDateTime lastRescheduledAt;

    @Column(name = "last_reschedule_message", length = 500)
    private String lastRescheduleMessage;

    // Why the appointment was cancelled (e.g. second missed appointment).
    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum Status {
        BOOKED, CHECKED_IN, IN_CONSULTATION, COMPLETED, CANCELLED
    }
}
