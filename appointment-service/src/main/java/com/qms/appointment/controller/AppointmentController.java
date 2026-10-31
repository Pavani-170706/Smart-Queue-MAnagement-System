package com.qms.appointment.controller;

import com.qms.appointment.entity.Appointment;
import com.qms.appointment.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> bookAppointment(@RequestBody Map<String, Object> request) {
        Long customerId = Long.parseLong((String) request.get("customerId"));
        Long doctorId = Long.parseLong((String) request.get("doctorId"));
        String date = (String) request.get("date");
        String timeSlot = (String) request.get("timeSlot");

        Map<String, Object> result = appointmentService.bookAppointment(customerId, doctorId, date, timeSlot);
        if ((boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.badRequest().body(result);
    }

    @GetMapping("/my/{customerId}")
    public ResponseEntity<Map<String, Object>> getMyAppointments(@PathVariable Long customerId) {
        List<Appointment> appointments = appointmentService.getMyAppointments(customerId);
        return ResponseEntity.ok(Map.of("success", true, "data", appointments));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getAppointment(@PathVariable Long id) {
        Appointment apt = appointmentService.getAppointment(id);
        if (apt == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of("success", true, "data", apt));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Map<String, Object>> cancelAppointment(
            @PathVariable Long id,
            @RequestParam(required = false) Long customerId) {
        Map<String, Object> result = appointmentService.cancelAppointment(id, customerId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<Map<String, Object>> getDoctorAppointments(
            @PathVariable Long doctorId,
            @RequestParam(required = false) String date) {
        List<Appointment> appointments = appointmentService.getDoctorAppointments(doctorId, date);
        return ResponseEntity.ok(Map.of("success", true, "data", appointments));
    }

    @GetMapping("/doctor/{doctorId}/all")
    public ResponseEntity<Map<String, Object>> getAllDoctorAppointments(@PathVariable Long doctorId) {
        List<Appointment> appointments = appointmentService.getAllDoctorAppointments(doctorId);
        return ResponseEntity.ok(Map.of("success", true, "data", appointments));
    }

    @GetMapping("/all")
    public ResponseEntity<Map<String, Object>> getAllAppointments() {
        List<Appointment> appointments = appointmentService.getAllAppointments();
        return ResponseEntity.ok(Map.of("success", true, "data", appointments));
    }

    @GetMapping("/slots")
    public ResponseEntity<Map<String, Object>> getAvailableSlots(
            @RequestParam Long doctorId,
            @RequestParam String date) {
        Map<String, Object> result = appointmentService.getAvailableSlots(doctorId, date);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        Map<String, Object> result = appointmentService.updateStatus(id, request.get("status"));
        if (Boolean.FALSE.equals(result.get("success")) && "Appointment not found".equals(result.get("message"))) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(result);
    }
}
