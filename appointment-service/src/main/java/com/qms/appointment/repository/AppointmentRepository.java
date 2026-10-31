package com.qms.appointment.repository;

import com.qms.appointment.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<Appointment> findByDoctorIdAndAppointmentDate(Long doctorId, LocalDate date);
    List<Appointment> findByDoctorIdOrderByAppointmentDateAscTimeSlotAsc(Long doctorId);
    List<Appointment> findByAppointmentDate(LocalDate date);
    List<Appointment> findByDoctorIdAndAppointmentDateAndStatusNotIn(Long doctorId, LocalDate date, List<Appointment.Status> statuses);
    long countByDoctorIdAndAppointmentDateAndStatusNotIn(Long doctorId, LocalDate date, List<Appointment.Status> statuses);
    List<Appointment> findByCustomerIdAndAppointmentDateAndTimeSlotAndStatusNot(Long customerId, LocalDate date, String timeSlot, Appointment.Status status);

    List<Appointment> findByAppointmentDateAndStatus(LocalDate date, Appointment.Status status);

    // Includes earlier days so a BOOKED appointment is still processed after downtime/restart.
    List<Appointment> findByAppointmentDateLessThanEqualAndStatus(LocalDate date, Appointment.Status status);

    // Any non-cancelled appointment already holding this doctor/date/slot (duplicate-slot guard).
    boolean existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusNot(
            Long doctorId, LocalDate date, String timeSlot, Appointment.Status status);

    // Atomic claim: only ONE caller can flip reminder_sent false -> true for a given
    // appointment occurrence (same date + slot, still BOOKED). Returns rows updated.
    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Appointment a set a.reminderSent = true, a.updatedAt = :now "
            + "where a.id = :id and a.status = :status and a.reminderSent = false "
            + "and a.appointmentDate = :date and a.timeSlot = :slot")
    int claimReminder(@Param("id") Long id, @Param("status") Appointment.Status status,
                      @Param("date") LocalDate date, @Param("slot") String slot,
                      @Param("now") LocalDateTime now);

    // Undo a claim when the notification could not be delivered (so it is retried).
    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Appointment a set a.reminderSent = false where a.id = :id "
            + "and a.appointmentDate = :date and a.timeSlot = :slot")
    int releaseReminder(@Param("id") Long id, @Param("date") LocalDate date, @Param("slot") String slot);

    // Atomic reschedule: succeeds only if the appointment is still BOOKED at the slot
    // that was judged "missed" and has the expected reschedule count.
    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Appointment a set a.appointmentDate = :newDate, a.timeSlot = :newSlot, "
            + "a.tokenNumber = :token, a.rescheduleCount = a.rescheduleCount + 1, a.reminderSent = false, "
            + "a.originalAppointmentDate = :origDate, a.originalTimeSlot = :origSlot, a.updatedAt = :now, "
            + "a.lastRescheduledAt = :now, a.lastRescheduleMessage = :message "
            + "where a.id = :id and a.status = :status and a.appointmentDate = :oldDate "
            + "and a.timeSlot = :oldSlot and a.rescheduleCount = :count")
    int claimReschedule(@Param("id") Long id, @Param("status") Appointment.Status status,
                        @Param("oldDate") LocalDate oldDate, @Param("oldSlot") String oldSlot,
                        @Param("count") Integer count,
                        @Param("newDate") LocalDate newDate, @Param("newSlot") String newSlot,
                        @Param("token") String token,
                        @Param("origDate") LocalDate origDate, @Param("origSlot") String origSlot,
                        @Param("now") LocalDateTime now, @Param("message") String message);

    // Roll back a reschedule if the queue-service refused it (e.g. patient just checked in).
    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Appointment a set a.appointmentDate = :oldDate, a.timeSlot = :oldSlot, "
            + "a.tokenNumber = :oldToken, a.rescheduleCount = :count, a.reminderSent = :reminder, "
            + "a.originalAppointmentDate = :origDate, a.originalTimeSlot = :origSlot, a.updatedAt = :now, "
            + "a.lastRescheduledAt = :lastAt, a.lastRescheduleMessage = :lastMsg "
            + "where a.id = :id and a.appointmentDate = :newDate and a.timeSlot = :newSlot")
    int revertReschedule(@Param("id") Long id,
                         @Param("newDate") LocalDate newDate, @Param("newSlot") String newSlot,
                         @Param("oldDate") LocalDate oldDate, @Param("oldSlot") String oldSlot,
                         @Param("oldToken") String oldToken, @Param("count") Integer count,
                         @Param("reminder") Boolean reminder,
                         @Param("origDate") LocalDate origDate, @Param("origSlot") String origSlot,
                         @Param("now") LocalDateTime now,
                         @Param("lastAt") LocalDateTime lastAt, @Param("lastMsg") String lastMsg);

    // Atomic second-miss cancellation.
    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Appointment a set a.status = :cancelled, a.updatedAt = :now, a.cancellationReason = :reason "
            + "where a.id = :id and a.status = :booked and a.appointmentDate = :date and a.timeSlot = :slot")
    int claimCancel(@Param("id") Long id, @Param("booked") Appointment.Status booked,
                    @Param("cancelled") Appointment.Status cancelled,
                    @Param("date") LocalDate date, @Param("slot") String slot,
                    @Param("now") LocalDateTime now, @Param("reason") String reason);

    @Transactional
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Appointment a set a.status = :booked, a.cancellationReason = null, a.updatedAt = :now where a.id = :id and a.status = :cancelled")
    int revertCancel(@Param("id") Long id, @Param("booked") Appointment.Status booked,
                     @Param("cancelled") Appointment.Status cancelled, @Param("now") LocalDateTime now);
}
