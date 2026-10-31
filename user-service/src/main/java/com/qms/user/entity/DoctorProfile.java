package com.qms.user.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "doctor_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 100)
    private String specialization;

    @Column(nullable = false, length = 100)
    private String department;

    @Column(nullable = false, length = 50)
    private String room;

    @Column(nullable = false)
    private Integer experience = 0;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(length = 200)
    private String qualification;

    @Column(name = "working_days", nullable = false, length = 100)
    private String workingDays = "MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY";

    @Column(name = "working_hours_start", nullable = false)
    private LocalTime workingHoursStart = LocalTime.of(9, 0);

    @Column(name = "working_hours_end", nullable = false)
    private LocalTime workingHoursEnd = LocalTime.of(17, 0);

    @Column(name = "max_daily_appointments", nullable = false)
    private Integer maxDailyAppointments = 20;

    @Column(name = "average_consultation_time", nullable = false)
    private Integer averageConsultationTime = 10;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
