package com.qms.medical.controller;

import com.qms.medical.entity.MedicalRecord;
import com.qms.medical.service.MedicalRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/medical-records")
@RequiredArgsConstructor
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createRecord(@RequestBody MedicalRecord record) {
        MedicalRecord created = medicalRecordService.createRecord(record);
        return ResponseEntity.ok(Map.of("success", true, "data", created));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<Map<String, Object>> getPatientRecords(@PathVariable Long patientId) {
        List<MedicalRecord> records = medicalRecordService.getRecordsForPatient(patientId);
        return ResponseEntity.ok(Map.of("success", true, "data", records));
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<Map<String, Object>> getDoctorRecords(@PathVariable Long doctorId) {
        List<MedicalRecord> records = medicalRecordService.getRecordsByDoctor(doctorId);
        return ResponseEntity.ok(Map.of("success", true, "data", records));
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<Map<String, Object>> getByAppointment(@PathVariable Long appointmentId) {
        MedicalRecord record = medicalRecordService.getRecordByAppointment(appointmentId);
        if (record == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of("success", true, "data", record));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getRecord(@PathVariable Long id) {
        MedicalRecord record = medicalRecordService.getRecordById(id);
        if (record == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of("success", true, "data", record));
    }
}
