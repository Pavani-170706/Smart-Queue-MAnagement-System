package com.qms.medical.service;

import com.qms.medical.entity.MedicalRecord;
import com.qms.medical.entity.Medicine;
import com.qms.medical.repository.MedicalRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;

    public MedicalRecord createRecord(MedicalRecord record) {
        record.setRecordDate(LocalDate.now());
        // Set back-reference for medicines
        if (record.getMedicines() != null) {
            record.getMedicines().forEach(med -> med.setMedicalRecord(record));
        }
        return medicalRecordRepository.save(record);
    }

    public List<MedicalRecord> getRecordsForPatient(Long patientId) {
        return medicalRecordRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
    }

    public List<MedicalRecord> getRecordsByDoctor(Long doctorId) {
        return medicalRecordRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId);
    }

    public MedicalRecord getRecordByAppointment(Long appointmentId) {
        return medicalRecordRepository.findByAppointmentId(appointmentId);
    }

    public MedicalRecord getRecordById(Long id) {
        return medicalRecordRepository.findById(id).orElse(null);
    }
}
