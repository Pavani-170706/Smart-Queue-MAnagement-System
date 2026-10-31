package com.qms.queue.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "queue_tokens")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QueueToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "appointment_id", nullable = false)
    private Long appointmentId;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "doctor_id", nullable = false)
    private Long doctorId;

    @Column(name = "doctor_profile_id", nullable = false)
    private Long doctorProfileId;

    @Column(name = "token_date", nullable = false)
    private LocalDate tokenDate;

    @Column(name = "token_number", nullable = false, length = 20)
    private String tokenNumber;

    @Column(name = "appointment_time", length = 10)
    private String appointmentTime;

    @Column(name = "sequence_number", nullable = false)
    private Integer sequenceNumber;

    @Column(name = "consultation_minutes")
    private Integer consultationMinutes = 10;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.BOOKED;

    @Column(name = "checked_in_at")
    private LocalDateTime checkedInAt;

    @Column(name = "consultation_started_at")
    private LocalDateTime consultationStartedAt;

    @Column(name = "consultation_ended_at")
    private LocalDateTime consultationEndedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Status {
        BOOKED, CHECKED_IN, WAITING, IN_CONSULTATION, COMPLETED, CANCELLED, SKIPPED, NO_SHOW
    }
}
