package com.qms.appointment.service;

import com.qms.appointment.client.NotificationServiceClient;
import com.qms.appointment.client.QueueServiceClient;
import com.qms.appointment.client.UserServiceClient;
import com.qms.appointment.entity.Appointment;
import com.qms.appointment.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserServiceClient userServiceClient;
    private final QueueServiceClient queueServiceClient;
    private final NotificationServiceClient notificationServiceClient;

    @Value("${qms.timezone:Asia/Kolkata}")
    private String timezone = "Asia/Kolkata";

    public LocalDate today() {
        return LocalDate.now(ZoneId.of(timezone));
    }

    // One lock per doctor so slot checks, token numbers and saves cannot interleave
    // between concurrent bookings / automatic reschedules (single appointment-service instance).
    private final java.util.concurrent.ConcurrentHashMap<Long, Object> doctorLocks =
            new java.util.concurrent.ConcurrentHashMap<>();

    public Object lockFor(Long doctorId) {
        return doctorLocks.computeIfAbsent(doctorId, id -> new Object());
    }

    // Next free token sequence for a doctor/day. Cancelled appointments are included on
    // purpose so a number is never reused (count + 1 would duplicate after a cancellation).
    public int nextTokenSequence(Long doctorId, LocalDate day, Long excludeAppointmentId) {
        int max = 0;
        for (Appointment other : appointmentRepository.findByDoctorIdAndAppointmentDate(doctorId, day)) {
            if (excludeAppointmentId != null && excludeAppointmentId.equals(other.getId())) continue;
            max = Math.max(max, tokenSequence(other.getTokenNumber()));
        }
        return max + 1;
    }

    public int tokenSequence(String token) {
        if (token == null) return 0;
        String digits = token.replaceAll("\\D", "");
        if (digits.isEmpty()) return 0;
        try {
            return Integer.parseInt(digits);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    // True when the slot on that day has already started (Asia/Kolkata).
    public boolean isPastSlot(LocalDate day, String slot) {
        try {
            return !java.time.LocalDateTime.of(day, LocalTime.parse(normalizeTime(slot)))
                    .isAfter(java.time.LocalDateTime.now(ZoneId.of(timezone)));
        } catch (Exception e) {
            return false;
        }
    }


    // ============================================================
    // GET ALLOWED DATES
    // Today, tomorrow, and day after tomorrow
    // ============================================================
    public List<String> getAllowedDates() {

        List<String> dates = new ArrayList<>();
        LocalDate now = today();

        for (int i = 0; i < 3; i++) {
            LocalDate candidate = now.plusDays(i);
            if (candidate.getDayOfWeek() != java.time.DayOfWeek.SUNDAY) {
                dates.add(candidate.toString());
            }
        }

        return dates;
    }


    // ============================================================
    // GENERATE TIME SLOTS
    // ============================================================
    public List<String> generateTimeSlots(
            String start,
            String end,
            int intervalMinutes
    ) {

        List<String> slots = new ArrayList<>();

        LocalTime startTime = LocalTime.parse(start);
        LocalTime endTime = LocalTime.parse(end);

        LocalTime current = startTime;

        while (
                current.plusMinutes(intervalMinutes).isBefore(endTime)
                        || current.plusMinutes(intervalMinutes).equals(endTime)
        ) {
            slots.add(current.toString());
            current = current.plusMinutes(intervalMinutes);
        }

        return slots;
    }


    // ============================================================
    // EXTRACT DOCTOR DATA FROM USER SERVICE RESPONSE
    // ============================================================
    public Map<String, Object> extractDoctorData(
            Map<String, Object> response
    ) {

        if (response == null) {
            return null;
        }

        Object data = response.get("data");

        if (data instanceof Map<?, ?>) {

            Map<?, ?> rawData = (Map<?, ?>) data;

            Map<String, Object> doctorData = new HashMap<>();

            for (Map.Entry<?, ?> entry : rawData.entrySet()) {

                doctorData.put(
                        String.valueOf(entry.getKey()),
                        entry.getValue()
                );
            }

            return doctorData;
        }

        if (response.get("profile") != null) {
            return response;
        }

        return null;
    }


    // ============================================================
    // GET AVAILABLE SLOTS
    // ============================================================
    public Map<String, Object> getAvailableSlots(
            Long doctorId,
            String date
    ) {

        LocalDate appointmentDate;

        try {
            appointmentDate = LocalDate.parse(date);
        } catch (Exception e) {

            return Map.of(
                    "error", "Invalid date format",
                    "slots", List.of()
            );
        }


        // Validate booking date

        List<String> allowedDates = getAllowedDates();

        if (!allowedDates.contains(date)) {

            return Map.of(
                    "error",
                    "Date must be today, tomorrow, or day after tomorrow",
                    "slots",
                    List.of()
            );
        }


        // Get doctor

        Map<String, Object> response;

        try {

            response = userServiceClient.getDoctor(doctorId);

        } catch (Exception e) {

            System.out.println(
                    "Error while getting doctor from User Service: "
                            + e.getMessage()
            );

            return Map.of(
                    "error",
                    "Doctor not found",
                    "slots",
                    List.of()
            );
        }


        Map<String, Object> doctorData =
                extractDoctorData(response);

        if (
                doctorData == null
                        || doctorData.get("profile") == null
        ) {

            return Map.of(
                    "error",
                    "Doctor not found",
                    "slots",
                    List.of()
            );
        }


        // Extract doctor profile

        Map<?, ?> profile =
                (Map<?, ?>) doctorData.get("profile");


        // Doctors work Monday-Saturday. Sunday is the weekly off day.
        String dayOfWeek =
                appointmentDate
                        .getDayOfWeek()
                        .getDisplayName(
                                TextStyle.FULL,
                                Locale.ENGLISH
                        )
                        .toUpperCase();

        if (appointmentDate.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
            return Map.of(
                    "error",
                    "Doctors are unavailable on Sundays",
                    "slots",
                    List.of()
            );
        }


        // Get working hours

        String start =
                String.valueOf(profile.get("workingHoursStart"));

        String end =
                String.valueOf(profile.get("workingHoursEnd"));

        start = normalizeTime(start);
        end = normalizeTime(end);


        // Consultation time

        int consultTime =
                ((Number) profile.get("averageConsultationTime"))
                        .intValue();


        // Generate all slots

        List<String> allSlots =
                generateTimeSlots(
                        start,
                        end,
                        consultTime
                );


        // Get already booked slots

        List<Appointment.Status> excludeStatuses =
                List.of(Appointment.Status.CANCELLED);

        List<Appointment> booked =
                appointmentRepository
                        .findByDoctorIdAndAppointmentDateAndStatusNotIn(
                                doctorId,
                                appointmentDate,
                                excludeStatuses
                        );


        Set<String> bookedTimes =
                booked.stream()
                        .map(Appointment::getTimeSlot)
                        .collect(Collectors.toSet());


        // Remove booked slots

        List<String> availableSlots =
                allSlots.stream()
                        .filter(slot -> !bookedTimes.contains(slot))
                        .filter(slot -> !isPastSlot(appointmentDate, slot))
                        .collect(Collectors.toList());


        return Map.of(
                "slots", availableSlots,
                "totalSlots", allSlots.size(),
                "bookedSlots", bookedTimes.size(),
                "maxDaily", profile.get("maxDailyAppointments")
        );
    }


    // ============================================================
    // NORMALIZE TIME
    // ============================================================
    public String normalizeTime(String time) {

        if (time == null || time.isBlank()) {
            return "00:00";
        }

        time = time.trim();

        if (time.matches("\\d{2}:\\d{2}:\\d{2}")) {
            return time.substring(0, 5);
        }

        if (time.matches("\\d{2}:\\d{2}")) {
            return time;
        }

        if (time.length() >= 16 && time.contains("T")) {
            return time.substring(11, 16);
        }

        return time;
    }


    // ============================================================
    // BOOK APPOINTMENT
    // ============================================================
    public Map<String, Object> bookAppointment(
            Long customerId,
            Long doctorId,
            String date,
            String timeSlot
    ) {

        LocalDate appointmentDate;

        try {

            appointmentDate = LocalDate.parse(date);

        } catch (Exception e) {

            return Map.of(
                    "success",
                    false,
                    "message",
                    "Invalid date format"
            );
        }


        // Validate date

        List<String> allowedDates = getAllowedDates();

        if (!allowedDates.contains(date)) {

            return Map.of(
                    "success",
                    false,
                    "message",
                    "Date must be today, tomorrow, or day after tomorrow"
            );
        }


        // Get doctor

        Map<String, Object> response;

        try {

            response = userServiceClient.getDoctor(doctorId);

        } catch (Exception e) {

            System.out.println(
                    "Error while getting doctor from User Service: "
                            + e.getMessage()
            );

            return Map.of(
                    "success",
                    false,
                    "message",
                    "Doctor is unavailable"
            );
        }


        Map<String, Object> doctorData =
                extractDoctorData(response);

        if (
                doctorData == null
                        || doctorData.get("profile") == null
        ) {

            return Map.of(
                    "success",
                    false,
                    "message",
                    "Doctor is unavailable"
            );
        }


        // Extract profile and user

        Map<?, ?> profile =
                (Map<?, ?>) doctorData.get("profile");

        Map<?, ?> user =
                (Map<?, ?>) doctorData.get("user");

        Long profileId =
                ((Number) profile.get("id")).longValue();


        // Doctors work Monday-Saturday. Sunday is the weekly off day.
        String dayOfWeek =
                appointmentDate
                        .getDayOfWeek()
                        .getDisplayName(
                                TextStyle.FULL,
                                Locale.ENGLISH
                        )
                        .toUpperCase();

        if (appointmentDate.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
            return Map.of(
                    "success",
                    false,
                    "message",
                    "Doctors are unavailable on Sundays. Please select another date."
            );
        }

        String start = normalizeTime(String.valueOf(profile.get("workingHoursStart")));
        String end = normalizeTime(String.valueOf(profile.get("workingHoursEnd")));
        int consultTime = ((Number) profile.get("averageConsultationTime")).intValue();
        List<String> validSlots = generateTimeSlots(start, end, consultTime);
        if (!validSlots.contains(timeSlot)) {
            return Map.of("success", false, "message", "Selected time slot is not available for this doctor");
        }


        // A slot that already started cannot be booked
        if (isPastSlot(appointmentDate, timeSlot)) {
            return Map.of("success", false, "message", "This time slot has already passed. Please select a later slot.");
        }

        String specialization = String.valueOf(profile.get("specialization"));
        String prefix = specialization.isEmpty() || "null".equals(specialization)
                ? "T"
                : String.valueOf(specialization.charAt(0));

        int maxDaily = profile.get("maxDailyAppointments") instanceof Number n
                ? n.intValue() : Integer.MAX_VALUE;

        long activeCount;
        int sequence;
        String tokenNumber;
        Appointment appointment;

        // Critical section: capacity, slot, duplicate and token-number checks + save are atomic per doctor.
        synchronized (lockFor(doctorId)) {
            activeCount = appointmentRepository.countByDoctorIdAndAppointmentDateAndStatusNotIn(
                    doctorId, appointmentDate, List.of(Appointment.Status.CANCELLED));

            if (activeCount >= maxDaily) {
                return Map.of("success", false, "message",
                        "Doctor is unavailable on the selected date. Please select another doctor or date.");
            }

            if (appointmentRepository.existsByDoctorIdAndAppointmentDateAndTimeSlotAndStatusNot(
                    doctorId, appointmentDate, timeSlot, Appointment.Status.CANCELLED)) {
                return Map.of("success", false, "message",
                        "This time slot has just been booked. Please select another slot.");
            }

            var conflict = appointmentRepository
                    .findByCustomerIdAndAppointmentDateAndTimeSlotAndStatusNot(
                            customerId, appointmentDate, timeSlot, Appointment.Status.CANCELLED);
            if (!conflict.isEmpty()) {
                return Map.of("success", false, "message", "You already have an appointment at this time");
            }

            sequence = nextTokenSequence(doctorId, appointmentDate, null);
            tokenNumber = prefix + "-" + String.format("%03d", sequence);

            appointment = Appointment.builder()
                    .customerId(customerId)
                    .doctorId(doctorId)
                    .doctorProfileId(profileId)
                    .appointmentDate(appointmentDate)
                    .timeSlot(timeSlot)
                    .tokenNumber(tokenNumber)
                    .status(Appointment.Status.BOOKED)
                    .build();

            appointmentRepository.save(appointment);
        }


        // ========================================================
        // CREATE QUEUE TOKEN
        // ========================================================

        Map<String, Object> queueRequest =
                new HashMap<>();

        queueRequest.put(
                "appointmentId",
                appointment.getId()
        );

        queueRequest.put(
                "customerId",
                customerId
        );

        queueRequest.put(
                "doctorId",
                doctorId
        );

        queueRequest.put(
                "doctorProfileId",
                profileId
        );

        queueRequest.put(
                "tokenNumber",
                tokenNumber
        );

        queueRequest.put(
                "appointmentTime",
                timeSlot
        );

        queueRequest.put(
                "sequenceNumber",
                sequence
        );

        queueRequest.put(
                "consultationMinutes",
                consultTime
        );

        queueRequest.put(
                "tokenDate",
                appointmentDate.toString()
        );


        boolean tokenCreated = false;
        for (int attempt = 1; attempt <= 2 && !tokenCreated; attempt++) {
            try {
                Map<String, Object> queueResponse = queueServiceClient.createToken(queueRequest);
                tokenCreated = queueResponse != null && !Boolean.FALSE.equals(queueResponse.get("success"));
            } catch (Exception e) {
                System.out.println("ERROR creating queue token for appointment "
                        + appointment.getId() + " (attempt " + attempt + "): " + e.getMessage());
            }
        }

        if (!tokenCreated) {
            // Every valid appointment must have a queue token: do not leave a token-less appointment behind.
            try {
                appointmentRepository.deleteById(appointment.getId());
            } catch (Exception e) {
                System.out.println("Could not roll back appointment " + appointment.getId() + ": " + e.getMessage());
            }
            return Map.of("success", false, "message",
                    "Could not create your queue token. Please try again in a moment.");
        }


        // ========================================================
        // CREATE NOTIFICATION
        // ========================================================

        try {

            Map<String, Object> notificationRequest =
                    new HashMap<>();

            notificationRequest.put(
                    "userId",
                    customerId
            );

            notificationRequest.put(
                    "title",
                    "Appointment Confirmed"
            );

            notificationRequest.put(
                    "message",
                    "Your appointment has been booked successfully. "
                            + "Your token number is "
                            + tokenNumber
                            + " for "
                            + appointmentDate
                            + " at "
                            + timeSlot
                            + "."
            );

            notificationRequest.put(
                    "type",
                    "APPOINTMENT"
            );

            notificationRequest.put(
                    "appointmentId",
                    appointment.getId()
            );


            Map<String, Object> notificationResponse =
                    notificationServiceClient.createNotification(
                            notificationRequest
                    );


            System.out.println(
                    "Notification created successfully for appointment: "
                            + appointment.getId()
            );

            System.out.println(
                    "Notification Service response: "
                            + notificationResponse
            );

            Map<String, Object> doctorNotificationRequest = new HashMap<>();
            doctorNotificationRequest.put("userId", doctorId);
            doctorNotificationRequest.put("title", "New Appointment Booked");
            doctorNotificationRequest.put("message", "A patient booked an appointment for "
                    + appointmentDate + " at " + timeSlot + ". Token: " + tokenNumber + ".");
            doctorNotificationRequest.put("type", "APPOINTMENT");
            doctorNotificationRequest.put("appointmentId", appointment.getId());
            notificationServiceClient.createNotification(doctorNotificationRequest);

        } catch (Exception e) {

            System.out.println(
                    "ERROR creating notification for appointment "
                            + appointment.getId()
                            + ": "
                            + e.getMessage()
            );
        }


        // --------------------------------------------------------
        // Get currently serving token
        // --------------------------------------------------------

        List<Appointment> todayTokens =
                appointmentRepository
                        .findByDoctorIdAndAppointmentDate(
                                doctorId,
                                appointmentDate
                        );

        String currentlyServing =
                todayTokens.stream()
                        .filter(
                                a ->
                                        a.getStatus()
                                                == Appointment.Status.IN_CONSULTATION
                        )
                        .map(Appointment::getTokenNumber)
                        .findFirst()
                        .orElse("None");


        // --------------------------------------------------------
        // Calculate people before customer
        // --------------------------------------------------------
        // Do not use total daily active appointments here: that also counts
        // patients scheduled AFTER this appointment. Only patients with an
        // earlier slot and an active, not-yet-completed status are ahead.
        long peopleBefore = todayTokens.stream()
                .filter(a -> !a.getId().equals(appointment.getId()))
                .filter(a -> a.getTimeSlot() != null
                        && normalizeTime(a.getTimeSlot()).compareTo(normalizeTime(timeSlot)) < 0)
                .filter(a -> a.getStatus() == Appointment.Status.BOOKED
                        || a.getStatus() == Appointment.Status.CHECKED_IN
                        || a.getStatus() == Appointment.Status.IN_CONSULTATION)
                .count();


        // --------------------------------------------------------
        // Calculate estimated waiting time
        // --------------------------------------------------------

        long estimatedWait =
                peopleBefore * consultTime;


        // --------------------------------------------------------
        // Doctor name
        // --------------------------------------------------------

        Object doctorName =
                user != null
                        ? user.get("fullName")
                        : "Doctor";


        // --------------------------------------------------------
        // Return booking response
        // --------------------------------------------------------

        Map<String, Object> bookingData = new HashMap<>();
        bookingData.put("appointmentId", appointment.getId());
        bookingData.put("tokenNumber", tokenNumber);
        bookingData.put("doctorName", doctorName);
        bookingData.put("specialization", specialization);
        bookingData.put("date", date);
        bookingData.put("timeSlot", timeSlot);
        bookingData.put("room", profile.get("room"));
        bookingData.put("currentlyServing", currentlyServing);
        bookingData.put("peopleBefore", peopleBefore);
        bookingData.put("estimatedWait", estimatedWait);
        bookingData.put("estimatedTurnTime",
                LocalTime.parse(normalizeTime(timeSlot)).plusMinutes(estimatedWait).toString());

        Map<String, Object> bookingResponse = new HashMap<>();
        bookingResponse.put("success", true);
        bookingResponse.put("message", "Appointment booked successfully");
        bookingResponse.put("data", bookingData);
        return bookingResponse;
    }


    // ============================================================
    // GET MY APPOINTMENTS
    // ============================================================
    public List<Appointment> getMyAppointments(
            Long customerId
    ) {

        return appointmentRepository
                .findByCustomerIdOrderByCreatedAtDesc(
                        customerId
                );
    }


    // ============================================================
    // GET APPOINTMENT BY ID
    // ============================================================
    public Appointment getAppointment(Long id) {

        return appointmentRepository
                .findById(id)
                .orElse(null);
    }


    // ============================================================
    // CANCEL APPOINTMENT
    // ============================================================
    public Map<String, Object> cancelAppointment(
            Long appointmentId,
            Long customerId
    ) {

        Appointment apt =
                appointmentRepository
                        .findById(appointmentId)
                        .orElse(null);

        if (apt == null) {

            return Map.of(
                    "success",
                    false,
                    "message",
                    "Appointment not found"
            );
        }


        if (
                customerId != null
                        && !apt.getCustomerId().equals(customerId)
        ) {

            return Map.of(
                    "success",
                    false,
                    "message",
                    "Unauthorized"
            );
        }


        if (
                apt.getStatus() == Appointment.Status.COMPLETED
                        || apt.getStatus() == Appointment.Status.CANCELLED
        ) {

            return Map.of(
                    "success",
                    false,
                    "message",
                    "Cannot cancel this appointment"
            );
        }


        Appointment.Status previousStatus = apt.getStatus();

        apt.setStatus(
                Appointment.Status.CANCELLED
        );

        if (apt.getCancellationReason() == null) {
            apt.setCancellationReason("Cancelled by patient");
        }

        apt.setUpdatedAt(
                java.time.LocalDateTime.now()
        );

        appointmentRepository.save(apt);

        // Keep the queue consistent when a booked appointment is cancelled
        // directly from the customer appointment screen.
        if (previousStatus == Appointment.Status.BOOKED) {
            try {
                queueServiceClient.autoCancelToken(apt.getId());
            } catch (Exception e) {
                System.out.println("Queue token cancellation failed for appointment "
                        + apt.getId() + ": " + e.getMessage());
            }
        }

        try {
            Map<String, Object> doctorNotification = new HashMap<>();
            doctorNotification.put("userId", apt.getDoctorId());
            doctorNotification.put("title", "Appointment Cancelled");
            doctorNotification.put("message", "A patient cancelled the appointment scheduled for "
                    + apt.getAppointmentDate() + " at " + apt.getTimeSlot() + ".");
            doctorNotification.put("type", "APPOINTMENT");
            doctorNotification.put("appointmentId", apt.getId());
            notificationServiceClient.createNotification(doctorNotification);
        } catch (Exception e) {
            System.out.println("Doctor cancellation notification failed for appointment "
                    + apt.getId() + ": " + e.getMessage());
        }

        return Map.of(
                "success",
                true,
                "message",
                "Appointment cancelled"
        );
    }


    // ============================================================
    // GET ALL APPOINTMENTS
    // ============================================================
    public Map<String, Object> updateStatus(Long appointmentId, String status) {
        Appointment appointment = appointmentRepository.findById(appointmentId).orElse(null);
        if (appointment == null) {
            return Map.of("success", false, "message", "Appointment not found");
        }

        try {
            appointment.setStatus(Appointment.Status.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            return Map.of("success", false, "message", "Invalid appointment status");
        }

        appointment.setUpdatedAt(java.time.LocalDateTime.now());
        appointmentRepository.save(appointment);
        return Map.of("success", true, "data", appointment);
    }



    public List<Appointment> getAllAppointments() {

        return appointmentRepository.findAll();
    }


    // ============================================================
    // GET DOCTOR APPOINTMENTS
    // ============================================================
    public List<Appointment> getDoctorAppointments(
            Long doctorId,
            String date
    ) {

        LocalDate appointmentDate =
                date != null
                        ? LocalDate.parse(date)
                        : today();

        return appointmentRepository
                .findByDoctorIdAndAppointmentDate(
                        doctorId,
                        appointmentDate
                );
    }

    public List<Appointment> getAllDoctorAppointments(Long doctorId) {
        return appointmentRepository.findByDoctorIdOrderByAppointmentDateAscTimeSlotAsc(doctorId);
    }
}