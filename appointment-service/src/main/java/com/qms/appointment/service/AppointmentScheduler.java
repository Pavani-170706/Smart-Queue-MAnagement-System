package com.qms.appointment.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Backend timers - no frontend involvement. Intervals are configurable in application.yml. */
@Component
@RequiredArgsConstructor
public class AppointmentScheduler {

    private static final Logger log = LoggerFactory.getLogger(AppointmentScheduler.class);

    private final AppointmentAutomationService automation;

    @Scheduled(fixedDelayString = "${qms.appointment-reminder-check-ms:30000}", initialDelay = 10000)
    public void reminderJob() {
        try {
            automation.sendDueReminders();
        } catch (Exception e) {
            log.error("Appointment reminder job failed: {}", e.getMessage());
        }
    }

    @Scheduled(fixedDelayString = "${qms.missed-appointment-check-ms:30000}", initialDelay = 15000)
    public void missedAppointmentJob() {
        try {
            automation.processMissedAppointments();
        } catch (Exception e) {
            log.error("Missed appointment job failed: {}", e.getMessage());
        }
    }
}
