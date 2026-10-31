package com.qms.appointment.service;

import com.qms.appointment.client.NotificationServiceClient;
import com.qms.appointment.client.QueueServiceClient;
import com.qms.appointment.client.UserServiceClient;
import com.qms.appointment.entity.Appointment;
import com.qms.appointment.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.*;

/**
 * Automatic appointment reminder + missed-appointment handling.
 *
 *  - reminder:  X minutes before the slot, exactly once per appointment occurrence
 *  - missed:    still BOOKED after (consultation minutes x 2) -> reschedule once, then cancel
 *
 * All duplicate protection is done with atomic conditional UPDATEs in the database.
 */
@Service
@RequiredArgsConstructor
public class AppointmentAutomationService {

    private static final Logger log = LoggerFactory.getLogger(AppointmentAutomationService.class);
    private static final int MAX_LOOKAHEAD_DAYS = 14;

    private final AppointmentRepository appointmentRepository;
    private final AppointmentService appointmentService;
    private final UserServiceClient userServiceClient;
    private final QueueServiceClient queueServiceClient;
    private final NotificationServiceClient notificationServiceClient;

    @Value("${qms.timezone:Asia/Kolkata}")
    private String timezone = "Asia/Kolkata";

    @Value("${qms.appointment-reminder-minutes:30}")
    private int reminderMinutes;

    @Value("${qms.grace-period-multiplier:2}")
    private int graceMultiplier;

    @Value("${qms.max-automatic-reschedules:1}")
    private int maxReschedules;

    private ZoneId zone() {
        return ZoneId.of(timezone);
    }

    // ------------------------------------------------------------------
    // Doctor info (working hours, consultation time, name, capacity)
    // ------------------------------------------------------------------
    private record DoctorInfo(String name, String start, String end, int consultMinutes, int maxDaily) {}

    private DoctorInfo loadDoctor(Long doctorId, Map<Long, Optional<DoctorInfo>> cache) {
        return cache.computeIfAbsent(doctorId, id -> {
            try {
                Map<String, Object> data = appointmentService.extractDoctorData(userServiceClient.getDoctor(id));
                if (data == null || !(data.get("profile") instanceof Map<?, ?> profile)) {
                    return Optional.empty();
                }
                String fullName = "Doctor";
                if (data.get("user") instanceof Map<?, ?> user && user.get("fullName") != null) {
                    fullName = String.valueOf(user.get("fullName")).trim();
                }
                String name = fullName.toLowerCase().startsWith("dr") ? fullName : "Dr. " + fullName;
                int consult = profile.get("averageConsultationTime") instanceof Number n ? n.intValue() : 10;
                int max = profile.get("maxDailyAppointments") instanceof Number n ? n.intValue() : Integer.MAX_VALUE;
                return Optional.of(new DoctorInfo(
                        name,
                        appointmentService.normalizeTime(String.valueOf(profile.get("workingHoursStart"))),
                        appointmentService.normalizeTime(String.valueOf(profile.get("workingHoursEnd"))),
                        consult <= 0 ? 10 : consult,
                        max));
            } catch (Exception e) {
                log.warn("[APPOINTMENT AUTOMATION] Could not load doctor {}: {}", id, e.getMessage());
                return Optional.empty();
            }
        }).orElse(null);
    }

    private LocalTime slotTime(String slot) {
        return LocalTime.parse(appointmentService.normalizeTime(slot));
    }

    // ------------------------------------------------------------------
    // Formatting helpers
    // ------------------------------------------------------------------
    static String formatTime(LocalTime t) {
        int h = t.getHour();
        String suffix = h >= 12 ? "PM" : "AM";
        int h12 = h % 12 == 0 ? 12 : h % 12;
        return h12 + ":" + String.format("%02d", t.getMinute()) + " " + suffix;
    }

    private String dayLabel(LocalDate date, LocalDate today) {
        if (date.equals(today)) return "today";
        if (date.equals(today.plusDays(1))) return "tomorrow";
        return date.toString();
    }

    private void sendNotification(Appointment a, String title, String message) {
        sendNotificationTo(a.getCustomerId(), title, message, a.getId());
    }

    private void sendNotificationTo(Long userId, String title, String message, Long appointmentId) {
        Map<String, Object> req = new HashMap<>();
        req.put("userId", userId);
        req.put("title", title);
        req.put("message", message);
        req.put("type", "APPOINTMENT");
        req.put("appointmentId", appointmentId);
        notificationServiceClient.createNotification(req);
    }

    private void sendDoctorNotification(Appointment a, String title, String message) {
        sendNotificationTo(a.getDoctorId(), title, message, a.getId());
    }

    // ==================================================================
    // 1. REMINDERS
    // ==================================================================
    public void sendDueReminders() {
        ZoneId zone = zone();
        LocalDateTime now = LocalDateTime.now(zone);
        LocalDate today = now.toLocalDate();
        Map<Long, Optional<DoctorInfo>> cache = new HashMap<>();

        for (Appointment a : appointmentRepository.findByAppointmentDateAndStatus(today, Appointment.Status.BOOKED)) {
            try {
                if (Boolean.TRUE.equals(a.getReminderSent())) continue;

                LocalDateTime start = LocalDateTime.of(a.getAppointmentDate(), slotTime(a.getTimeSlot()));
                LocalDateTime reminderAt = start.minusMinutes(reminderMinutes);

                // due: reminder time reached and appointment not started yet
                if (now.isBefore(reminderAt) || !now.isBefore(start)) continue;

                // Atomic claim - only one scheduler run can win this.
                int claimed = appointmentRepository.claimReminder(
                        a.getId(), Appointment.Status.BOOKED, a.getAppointmentDate(), a.getTimeSlot(), now);
                if (claimed != 1) continue;

                DoctorInfo doc = loadDoctor(a.getDoctorId(), cache);
                String doctorName = doc != null ? doc.name() : "your doctor";
                try {
                    sendNotification(a, "Appointment Reminder",
                            "Reminder: Your appointment with " + doctorName + " is scheduled for "
                                    + dayLabel(a.getAppointmentDate(), today) + " at "
                                    + formatTime(slotTime(a.getTimeSlot())) + ". Please check in on time.");
                    log.info("[APPOINTMENT REMINDER]\nAppointment ID: {}\nReminder sent for: {} {}",
                            a.getId(), a.getAppointmentDate(), a.getTimeSlot());
                } catch (Exception e) {
                    appointmentRepository.releaseReminder(a.getId(), a.getAppointmentDate(), a.getTimeSlot());
                    log.warn("[APPOINTMENT REMINDER] Notification failed for appointment {}, will retry: {}",
                            a.getId(), e.getMessage());
                }
            } catch (Exception e) {
                log.warn("[APPOINTMENT REMINDER] Skipped appointment {}: {}", a.getId(), e.getMessage());
            }
        }
    }

    // ==================================================================
    // 2. MISSED APPOINTMENTS (reschedule once, then cancel)
    // ==================================================================
    public void processMissedAppointments() {
        ZoneId zone = zone();
        LocalDateTime now = LocalDateTime.now(zone);
        LocalDate today = now.toLocalDate();
        Map<Long, Optional<DoctorInfo>> cache = new HashMap<>();

        // Only BOOKED appointments - CHECKED_IN / IN_CONSULTATION / COMPLETED / CANCELLED are never touched.
        // Earlier days are included so appointments missed while the service was down are still handled.
        for (Appointment a : appointmentRepository.findByAppointmentDateLessThanEqualAndStatus(today, Appointment.Status.BOOKED)) {
            try {
                DoctorInfo doc = loadDoctor(a.getDoctorId(), cache);
                if (doc == null) continue;

                LocalDateTime slotStart = LocalDateTime.of(a.getAppointmentDate(), slotTime(a.getTimeSlot()));
                // Appointments booked after their slot began get their grace from the booking time.
                LocalDateTime effectiveStart = a.getCreatedAt() != null && a.getCreatedAt().isAfter(slotStart)
                        ? a.getCreatedAt() : slotStart;
                LocalDateTime graceEnd = effectiveStart.plusMinutes((long) doc.consultMinutes() * graceMultiplier);
                if (now.isBefore(graceEnd)) continue;

                int count = a.getRescheduleCount() == null ? 0 : a.getRescheduleCount();
                if (count >= maxReschedules) {
                    cancelMissed(a, doc, today);
                } else {
                    reschedule(a, doc, now, today, cache);
                }
            } catch (Exception e) {
                log.warn("[APPOINTMENT AUTOMATION] Skipped appointment {}: {}", a.getId(), e.getMessage());
            }
        }
    }

    private void cancelMissed(Appointment a, DoctorInfo doc, LocalDate today) {
        LocalDateTime now = LocalDateTime.now(zone());
        String reason = "Missed rescheduled appointment - did not check in within the "
                + (doc.consultMinutes() * graceMultiplier) + "-minute grace period";
        int claimed = appointmentRepository.claimCancel(a.getId(), Appointment.Status.BOOKED,
                Appointment.Status.CANCELLED, a.getAppointmentDate(), a.getTimeSlot(), now, reason);
        if (claimed != 1) return;

        try {
            Map<String, Object> res = queueServiceClient.autoCancelToken(a.getId());
            if (Boolean.FALSE.equals(res.get("success"))) {
                // patient already checked in on the queue side - undo
                appointmentRepository.revertCancel(a.getId(), Appointment.Status.BOOKED,
                        Appointment.Status.CANCELLED, now);
                log.info("[APPOINTMENT CANCELLED] Appointment {} not cancelled: {}", a.getId(), res.get("message"));
                return;
            }
        } catch (Exception e) {
            appointmentRepository.revertCancel(a.getId(), Appointment.Status.BOOKED,
                    Appointment.Status.CANCELLED, now);
            log.warn("[APPOINTMENT CANCELLED] Queue service unavailable for appointment {}, will retry: {}",
                    a.getId(), e.getMessage());
            return;
        }

        log.info("[APPOINTMENT CANCELLED]\nAppointment ID: {}\nReason: missed rescheduled appointment", a.getId());
        try {
            sendNotification(a, "Appointment Cancelled",
                    "Your appointment with " + doc.name() + " has been cancelled because you did not check in within the "
                            + (doc.consultMinutes() * graceMultiplier)
                            + "-minute grace period for your rescheduled appointment.");
        } catch (Exception e) {
            log.warn("Cancellation notification failed for appointment {}: {}", a.getId(), e.getMessage());
        }

        try {
            sendDoctorNotification(a, "Appointment Cancelled",
                    "Patient appointment for " + formatTime(slotTime(a.getTimeSlot()))
                            + " was automatically cancelled after the rescheduled appointment was missed.");
        } catch (Exception e) {
            log.warn("Doctor cancellation notification failed for appointment {}: {}", a.getId(), e.getMessage());
        }
    }

    private void reschedule(Appointment a, DoctorInfo doc, LocalDateTime now, LocalDate today,
                            Map<Long, Optional<DoctorInfo>> cache) {
        LocalDate oldDate = a.getAppointmentDate();
        String oldSlot = a.getTimeSlot();
        String oldToken = a.getTokenNumber();
        Integer oldCount = a.getRescheduleCount() == null ? 0 : a.getRescheduleCount();
        Boolean oldReminder = a.getReminderSent();
        LocalDate origDate = a.getOriginalAppointmentDate() != null ? a.getOriginalAppointmentDate() : oldDate;
        String origSlot = a.getOriginalTimeSlot() != null ? a.getOriginalTimeSlot() : oldSlot;
        LocalDateTime oldLastAt = a.getLastRescheduledAt();
        String oldLastMsg = a.getLastRescheduleMessage();

        LocalDate newDate;
        String newSlot;
        String newToken;
        int claimed;

        // Slot search, token number and the atomic claim happen under the doctor lock so a
        // concurrent booking cannot take the same slot or token number.
        synchronized (appointmentService.lockFor(a.getDoctorId())) {
            Optional<Map.Entry<LocalDate, String>> found = findNextSlot(a, doc, now);
            if (found.isEmpty()) {
                log.warn("[APPOINTMENT RESCHEDULE] No free slot found for appointment {} within {} days",
                        a.getId(), MAX_LOOKAHEAD_DAYS);
                return;
            }
            newDate = found.get().getKey();
            newSlot = found.get().getValue();
            newToken = nextToken(a, newDate);

            String message = "Automatically rescheduled from " + origDate + " " + formatTime(slotTime(origSlot))
                    + " to " + newDate + " " + formatTime(slotTime(newSlot))
                    + " because the appointment was missed.";

            claimed = appointmentRepository.claimReschedule(a.getId(), Appointment.Status.BOOKED,
                    oldDate, oldSlot, oldCount, newDate, newSlot, newToken, origDate, origSlot, now, message);
        }
        if (claimed != 1) return;

        int sequence = appointmentService.tokenSequence(newToken);
        Map<String, Object> req = new HashMap<>();
        req.put("tokenDate", newDate.toString());
        req.put("appointmentTime", newSlot);
        req.put("tokenNumber", newToken);
        req.put("sequenceNumber", sequence);
        req.put("consultationMinutes", doc.consultMinutes());

        try {
            Map<String, Object> res = queueServiceClient.rescheduleToken(a.getId(), req);
            if (Boolean.FALSE.equals(res.get("success"))) {
                appointmentRepository.revertReschedule(a.getId(), newDate, newSlot, oldDate, oldSlot, oldToken,
                        oldCount, Boolean.TRUE.equals(oldReminder),
                        a.getOriginalAppointmentDate(), a.getOriginalTimeSlot(), now, oldLastAt, oldLastMsg);
                log.info("[APPOINTMENT RESCHEDULE] Appointment {} not rescheduled: {}", a.getId(), res.get("message"));
                return;
            }
        } catch (Exception e) {
            appointmentRepository.revertReschedule(a.getId(), newDate, newSlot, oldDate, oldSlot, oldToken,
                    oldCount, Boolean.TRUE.equals(oldReminder),
                    a.getOriginalAppointmentDate(), a.getOriginalTimeSlot(), now, oldLastAt, oldLastMsg);
            log.warn("[APPOINTMENT RESCHEDULE] Queue service unavailable for appointment {}, will retry: {}",
                    a.getId(), e.getMessage());
            return;
        }

        log.info("[APPOINTMENT RESCHEDULE]\nAppointment ID: {}\nOld slot: {} {}\nNew slot: {} {}",
                a.getId(), oldDate, oldSlot, newDate, newSlot);
        log.info("[APPOINTMENT REMINDER RESET]\nAppointment ID: {}\nNew appointment: {} {}",
                a.getId(), newDate, newSlot);

        String when = dayLabel(newDate, today) + " at " + formatTime(slotTime(newSlot));
        try {
            if (newDate.equals(today)) {
                sendNotification(a, "Appointment Postponed",
                        "Your appointment has been postponed. Your new appointment with " + doc.name() + " is "
                                + when + ". Your new token is " + newToken + ". Please check in on time.");
            } else {
                sendNotification(a, "Appointment Rescheduled",
                        "Your appointment has been rescheduled. Your new appointment with " + doc.name() + " is "
                                + when + ". Your new token is " + newToken + ". Please check in on time.");
            }
        } catch (Exception e) {
            log.warn("Reschedule notification failed for appointment {}: {}", a.getId(), e.getMessage());
        }

        try {
            sendDoctorNotification(a, "Appointment Rescheduled",
                    "A patient appointment was automatically rescheduled to " + when
                            + ". New token: " + newToken + ".");
        } catch (Exception e) {
            log.warn("Doctor reschedule notification failed for appointment {}: {}", a.getId(), e.getMessage());
        }
    }

    // ------------------------------------------------------------------
    // Slot search: earliest free slot later today, else next working day (never Sunday)
    // ------------------------------------------------------------------
    private Optional<Map.Entry<LocalDate, String>> findNextSlot(Appointment a, DoctorInfo doc, LocalDateTime now) {
        List<String> allSlots = appointmentService.generateTimeSlots(doc.start(), doc.end(), doc.consultMinutes());
        LocalDate today = now.toLocalDate();

        for (int i = 0; i <= MAX_LOOKAHEAD_DAYS; i++) {
            LocalDate day = today.plusDays(i);
            if (day.getDayOfWeek() == DayOfWeek.SUNDAY) continue;

            List<Appointment> active = appointmentRepository.findByDoctorIdAndAppointmentDateAndStatusNotIn(
                    a.getDoctorId(), day, List.of(Appointment.Status.CANCELLED));
            if (active.size() >= doc.maxDaily()) continue;

            Set<String> taken = new HashSet<>();
            for (Appointment other : active) {
                taken.add(appointmentService.normalizeTime(other.getTimeSlot()));
            }
            // the patient must not already hold another appointment at the target time
            Set<String> patientSlots = new HashSet<>();
            for (Appointment mine : appointmentRepository.findByCustomerIdOrderByCreatedAtDesc(a.getCustomerId())) {
                if (mine.getStatus() != Appointment.Status.CANCELLED && day.equals(mine.getAppointmentDate())) {
                    patientSlots.add(appointmentService.normalizeTime(mine.getTimeSlot()));
                }
            }

            for (String slot : allSlots) {
                if (taken.contains(slot) || patientSlots.contains(slot)) continue;
                // never fall back onto the slot that was just missed
                if (day.equals(a.getAppointmentDate())
                        && appointmentService.normalizeTime(a.getTimeSlot()).equals(slot)) continue;
                // today: slot must still be in the future
                if (i == 0 && !LocalDateTime.of(day, slotTime(slot)).isAfter(now)) continue;
                return Optional.of(Map.entry(day, slot));
            }
        }
        return Optional.empty();
    }

    private String nextToken(Appointment a, LocalDate day) {
        String current = a.getTokenNumber();
        String prefix = current != null && current.contains("-") ? current.substring(0, current.indexOf('-')) : "T";
        int seq = appointmentService.nextTokenSequence(a.getDoctorId(), day, a.getId());
        return prefix + "-" + String.format("%03d", seq);
    }
}
