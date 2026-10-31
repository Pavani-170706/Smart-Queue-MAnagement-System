package com.qms.queue.service;

import com.qms.queue.client.AppointmentServiceClient;
import com.qms.queue.client.NotificationServiceClient;
import com.qms.queue.entity.QueueToken;
import com.qms.queue.repository.QueueTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class QueueService {

    private final QueueTokenRepository queueTokenRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final AppointmentServiceClient appointmentServiceClient;
    private final NotificationServiceClient notificationServiceClient;

    private static final int DEFAULT_CONSULTATION_MINUTES = 10;

    private int consultationMinutes(QueueToken token) {
        return token.getConsultationMinutes() == null || token.getConsultationMinutes() <= 0
                ? DEFAULT_CONSULTATION_MINUTES
                : token.getConsultationMinutes();
    }

    private void syncAppointmentStatus(Long appointmentId, String status) {
        try {
            appointmentServiceClient.updateStatus(
                    appointmentId,
                    Map.of("status", status)
            );
        } catch (Exception e) {
            System.out.println("Appointment status sync failed for " + appointmentId + ": " + e.getMessage());
        }
    }

    private void sendNotification(Long userId, String title, String message, Long appointmentId) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("userId", userId);
            request.put("title", title);
            request.put("message", message);
            request.put("type", "QUEUE");
            request.put("appointmentId", appointmentId);
            notificationServiceClient.createNotification(request);
        } catch (Exception e) {
            System.out.println("Notification failed for user " + userId + ": " + e.getMessage());
        }
    }

    // Notify the next active patient as soon as the current consultation starts.
    private void notifyNextPatient(QueueToken current) {
        List<QueueToken> queue = queueTokenRepository
                .findByDoctorIdAndTokenDateOrderBySequenceNumber(current.getDoctorId(), current.getTokenDate());

        queue.stream()
                .filter(token -> token.getSequenceNumber() > current.getSequenceNumber())
                .filter(token -> token.getStatus() == QueueToken.Status.BOOKED
                        || token.getStatus() == QueueToken.Status.CHECKED_IN
                        || token.getStatus() == QueueToken.Status.WAITING)
                .min(Comparator.comparing(QueueToken::getSequenceNumber))
                .ifPresent(next -> sendNotification(
                        next.getCustomerId(),
                        "Your turn is next",
                        "The doctor is currently checking token " + current.getTokenNumber()
                                + ". Please be ready. Your token " + next.getTokenNumber() + " is next.",
                        next.getAppointmentId()
                ));
    }

    // Legacy no-show helper retained for backward compatibility.
    // Automatic missed-appointment handling is owned by Appointment Service so
    // the configured one-time reschedule flow is not bypassed.
    private void processNoShows(QueueToken completedToken) {
        List<QueueToken> queue = queueTokenRepository
                .findByDoctorIdAndTokenDateOrderBySequenceNumber(
                        completedToken.getDoctorId(),
                        completedToken.getTokenDate()
                );

        for (QueueToken candidate : queue) {
            if (candidate.getStatus() != QueueToken.Status.BOOKED
                    || candidate.getSequenceNumber() >= completedToken.getSequenceNumber()) {
                continue;
            }

            long completedAfter = queue.stream()
                    .filter(token -> token.getSequenceNumber() > candidate.getSequenceNumber())
                    .filter(token -> token.getSequenceNumber() <= completedToken.getSequenceNumber())
                    .filter(token -> token.getStatus() == QueueToken.Status.COMPLETED)
                    .count();

            if (completedAfter >= 2) {
                candidate.setStatus(QueueToken.Status.NO_SHOW);
                queueTokenRepository.save(candidate);
                syncAppointmentStatus(candidate.getAppointmentId(), "CANCELLED");
                sendNotification(
                        candidate.getCustomerId(),
                        "Appointment cancelled",
                        "Your appointment for token " + candidate.getTokenNumber()
                                + " was cancelled because you did not check in before two patients after you were seen.",
                        candidate.getAppointmentId()
                );
            }
        }
    }

    // ============================================================
    // CREATE QUEUE TOKEN
    // Called by Appointment Service
    // ============================================================
    public QueueToken createToken(
            Long appointmentId,
            Long customerId,
            Long doctorId,
            Long doctorProfileId,
            LocalDate tokenDate,
            String tokenNumber,
            int sequenceNumber,
            Integer consultationMinutes,
            String appointmentTime
    ) {
        QueueToken existing = queueTokenRepository.findByAppointmentId(appointmentId);
        if (existing != null) {
            return existing;
        }

        QueueToken token = QueueToken.builder()
                .appointmentId(appointmentId)
                .customerId(customerId)
                .doctorId(doctorId)
                .doctorProfileId(doctorProfileId)
                .tokenDate(tokenDate)
                .tokenNumber(tokenNumber)
                .appointmentTime(appointmentTime)
                .sequenceNumber(sequenceNumber)
                .consultationMinutes(consultationMinutes == null || consultationMinutes <= 0
                        ? DEFAULT_CONSULTATION_MINUTES
                        : consultationMinutes)
                .status(QueueToken.Status.BOOKED)
                .build();

        return queueTokenRepository.save(token);
    }

    // Backward-compatible overload used by older unit tests.
    public QueueToken createToken(
            Long appointmentId,
            Long customerId,
            Long doctorId,
            Long doctorProfileId,
            String tokenNumber,
            int sequenceNumber
    ) {
        return createToken(
                appointmentId, customerId, doctorId, doctorProfileId,
                LocalDate.now(), tokenNumber, sequenceNumber,
                DEFAULT_CONSULTATION_MINUTES, null
        );
    }

    // ============================================================
    // GET QUEUE FOR DOCTOR
    // ============================================================
    public List<QueueToken> getQueue(Long doctorId, String date) {
        LocalDate tokenDate = date != null ? LocalDate.parse(date) : LocalDate.now();
        return queueTokenRepository.findByDoctorIdAndTokenDateOrderBySequenceNumber(doctorId, tokenDate);
    }

    // ============================================================
    // GET CUSTOMER TOKENS
    // ============================================================
    public List<QueueToken> getCustomerTokens(Long customerId) {
        return queueTokenRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    // ============================================================
    // CHECK IN PATIENT
    // ============================================================
    public Map<String, Object> checkIn(Long tokenId) {
        QueueToken token = queueTokenRepository.findById(tokenId).orElse(null);
        if (token == null) return Map.of("success", false, "message", "Token not found");

        if (token.getStatus() != QueueToken.Status.BOOKED) {
            return Map.of("success", false, "message", "Token cannot be checked in with current status");
        }

        token.setStatus(QueueToken.Status.WAITING);
        token.setCheckedInAt(LocalDateTime.now());
        queueTokenRepository.save(token);
        syncAppointmentStatus(token.getAppointmentId(), "CHECKED_IN");
        broadcastQueueUpdate(token.getDoctorId(), token.getTokenDate().toString());

        return Map.of("success", true, "message", "Patient checked in successfully");
    }

    // ============================================================
    // START CONSULTATION
    // ============================================================
    public Map<String, Object> startConsultation(Long tokenId, Long doctorId) {
        QueueToken token = queueTokenRepository.findById(tokenId).orElse(null);
        if (token == null) return Map.of("success", false, "message", "Token not found");

        if (doctorId != null && !token.getDoctorId().equals(doctorId)) {
            return Map.of("success", false, "message", "Unauthorized");
        }

        // A doctor may start a consultation directly from the Doctor module.
        // BOOKED is allowed in addition to the receptionist/check-in states.
        if (token.getStatus() != QueueToken.Status.BOOKED
                && token.getStatus() != QueueToken.Status.WAITING
                && token.getStatus() != QueueToken.Status.CHECKED_IN) {
            return Map.of("success", false, "message", "Token cannot be started from its current status");
        }

        token.setStatus(QueueToken.Status.IN_CONSULTATION);
        token.setConsultationStartedAt(LocalDateTime.now());
        queueTokenRepository.save(token);
        syncAppointmentStatus(token.getAppointmentId(), "IN_CONSULTATION");

        // This is the point at which the next patient is told to get ready.
        notifyNextPatient(token);
        broadcastQueueUpdate(token.getDoctorId(), token.getTokenDate().toString());

        return Map.of("success", true, "message", "Consultation started");
    }

    // ============================================================
    // COMPLETE CONSULTATION
    // ============================================================
    public Map<String, Object> complete(Long tokenId, Long doctorId) {
        QueueToken token = queueTokenRepository.findById(tokenId).orElse(null);
        if (token == null) return Map.of("success", false, "message", "Token not found");

        if (doctorId != null && !token.getDoctorId().equals(doctorId)) {
            return Map.of("success", false, "message", "Unauthorized");
        }

        if (token.getStatus() != QueueToken.Status.IN_CONSULTATION) {
            return Map.of("success", false, "message", "Only an active consultation can be completed");
        }

        token.setStatus(QueueToken.Status.COMPLETED);
        token.setConsultationEndedAt(LocalDateTime.now());
        queueTokenRepository.save(token);
        syncAppointmentStatus(token.getAppointmentId(), "COMPLETED");

        // Missed appointments are handled by Appointment Service's scheduled
        // automation. This is intentionally not handled here because a missed
        // appointment must be automatically rescheduled once before cancellation.
        broadcastQueueUpdate(token.getDoctorId(), token.getTokenDate().toString());
        return Map.of("success", true, "message", "Consultation completed");
    }

    // ============================================================
    // CANCEL TOKEN
    // ============================================================
    public Map<String, Object> cancelToken(Long tokenId) {
        QueueToken token = queueTokenRepository.findById(tokenId).orElse(null);
        if (token == null) return Map.of("success", false, "message", "Token not found");

        if (token.getStatus() == QueueToken.Status.COMPLETED
                || token.getStatus() == QueueToken.Status.CANCELLED
                || token.getStatus() == QueueToken.Status.NO_SHOW) {
            return Map.of("success", false, "message", "Cannot cancel this token");
        }

        token.setStatus(QueueToken.Status.CANCELLED);
        queueTokenRepository.save(token);
        syncAppointmentStatus(token.getAppointmentId(), "CANCELLED");
        broadcastQueueUpdate(token.getDoctorId(), token.getTokenDate().toString());
        return Map.of("success", true, "message", "Token cancelled");
    }

    // ============================================================
    // SKIP TOKEN
    // ============================================================
    public Map<String, Object> skipToken(Long tokenId) {
        QueueToken token = queueTokenRepository.findById(tokenId).orElse(null);
        if (token == null) return Map.of("success", false, "message", "Token not found");

        if (token.getStatus() != QueueToken.Status.WAITING
                && token.getStatus() != QueueToken.Status.BOOKED) {
            return Map.of("success", false, "message", "Cannot skip this token");
        }

        token.setStatus(QueueToken.Status.SKIPPED);
        queueTokenRepository.save(token);
        broadcastQueueUpdate(token.getDoctorId(), token.getTokenDate().toString());
        return Map.of("success", true, "message", "Token skipped");
    }

    // ============================================================
    // GET TOKEN STATUS
    // ============================================================
    public Map<String, Object> getTokenStatus(Long appointmentId) {
        QueueToken token = queueTokenRepository.findByAppointmentId(appointmentId);
        if (token == null) return null;

        List<QueueToken> allTokens = queueTokenRepository
                .findByDoctorIdAndTokenDateOrderBySequenceNumber(token.getDoctorId(), token.getTokenDate());

        List<QueueToken> activeTokens = allTokens.stream()
                .filter(t -> t.getStatus() != QueueToken.Status.CANCELLED
                        && t.getStatus() != QueueToken.Status.NO_SHOW
                        && t.getStatus() != QueueToken.Status.COMPLETED
                        && t.getStatus() != QueueToken.Status.SKIPPED)
                .toList();

        String currentlyServing = activeTokens.stream()
                .filter(t -> t.getStatus() == QueueToken.Status.IN_CONSULTATION)
                .map(QueueToken::getTokenNumber)
                .findFirst()
                .orElse("None");

        long peopleBefore = activeTokens.stream()
                .filter(t -> t.getSequenceNumber() < token.getSequenceNumber())
                .count();

        int minutesPerPatient = consultationMinutes(token);
        long estimatedWait = peopleBefore * minutesPerPatient;

        String estimatedTurnTime;
        if (token.getStatus() == QueueToken.Status.IN_CONSULTATION) {
            estimatedTurnTime = "Now";
        } else {
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            java.time.LocalDateTime base = now;
            try {
                if (token.getAppointmentTime() != null && !token.getAppointmentTime().isBlank()) {
                    java.time.LocalTime appointmentTime = java.time.LocalTime.parse(token.getAppointmentTime().substring(0, Math.min(5, token.getAppointmentTime().length())));
                    java.time.LocalDateTime scheduled = java.time.LocalDateTime.of(token.getTokenDate(), appointmentTime);
                    if (scheduled.isAfter(now)) {
                        base = scheduled;
                    }
                }
            } catch (Exception ignored) {
                // Fall back to the current time when an older token has no valid appointment time.
            }
            estimatedTurnTime = base.plusMinutes(estimatedWait)
                    .withSecond(0)
                    .withNano(0)
                    .toLocalTime()
                    .toString();
        }

        return Map.of(
                "token", token,
                "currentlyServing", currentlyServing,
                "peopleBefore", peopleBefore,
                "estimatedWait", estimatedWait,
                "estimatedTurnTime", estimatedTurnTime,
                "consultationMinutes", minutesPerPatient
        );
    }

    // ============================================================
    // AUTOMATIC RESCHEDULE
    // Called by Appointment Service when a BOOKED patient missed the slot.
    // Only a token that has NOT been checked in may be moved.
    // ============================================================
    public Map<String, Object> rescheduleToken(
            Long appointmentId, LocalDate newDate, String newTime,
            String newTokenNumber, int newSequence, Integer minutes) {

        QueueToken token = queueTokenRepository.findByAppointmentId(appointmentId);
        if (token == null) return Map.of("success", false, "message", "Token not found");

        if (token.getStatus() != QueueToken.Status.BOOKED
                && token.getStatus() != QueueToken.Status.SKIPPED) {
            return Map.of("success", false, "message", "Token already progressed: " + token.getStatus());
        }

        LocalDate oldDate = token.getTokenDate();
        token.setTokenDate(newDate);
        token.setAppointmentTime(newTime);
        token.setTokenNumber(newTokenNumber);
        token.setSequenceNumber(newSequence);
        if (minutes != null && minutes > 0) token.setConsultationMinutes(minutes);
        token.setStatus(QueueToken.Status.BOOKED);
        token.setCheckedInAt(null);
        token.setConsultationStartedAt(null);
        token.setConsultationEndedAt(null);
        queueTokenRepository.save(token);

        broadcastQueueUpdate(token.getDoctorId(), oldDate.toString());
        if (!oldDate.equals(newDate)) {
            broadcastQueueUpdate(token.getDoctorId(), newDate.toString());
        }
        return Map.of("success", true, "data", token);
    }

    // ============================================================
    // AUTOMATIC CANCEL (second missed appointment)
    // Does not call back into appointment-service (it already cancelled).
    // ============================================================
    public Map<String, Object> autoCancelToken(Long appointmentId) {
        QueueToken token = queueTokenRepository.findByAppointmentId(appointmentId);
        if (token == null) return Map.of("success", true, "message", "No token to cancel");

        if (token.getStatus() != QueueToken.Status.BOOKED
                && token.getStatus() != QueueToken.Status.SKIPPED) {
            return Map.of("success", false, "message", "Token already progressed: " + token.getStatus());
        }
        token.setStatus(QueueToken.Status.NO_SHOW);
        queueTokenRepository.save(token);
        broadcastQueueUpdate(token.getDoctorId(), token.getTokenDate().toString());
        return Map.of("success", true, "message", "Token cancelled");
    }

    // ============================================================
    // BROADCAST QUEUE UPDATE
    // ============================================================
    private void broadcastQueueUpdate(Long doctorId, String date) {
        List<QueueToken> queue = getQueue(doctorId, date);
        messagingTemplate.convertAndSend("/topic/queue/" + doctorId, queue);
    }
}
