package com.qms.queue.repository;

import com.qms.queue.entity.QueueToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface QueueTokenRepository extends JpaRepository<QueueToken, Long> {
    List<QueueToken> findByDoctorIdAndTokenDateOrderBySequenceNumber(Long doctorId, LocalDate date);
    List<QueueToken> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<QueueToken> findByTokenDate(LocalDate date);
    QueueToken findByAppointmentId(Long appointmentId);
    long countByDoctorIdAndTokenDateAndStatusNotIn(Long doctorId, LocalDate date, List<QueueToken.Status> statuses);
    List<QueueToken> findByDoctorIdAndTokenDateAndStatus(Long doctorId, LocalDate date, QueueToken.Status status);

    List<QueueToken> findByDoctorIdAndTokenDateAndStatusIn(Long doctorId, LocalDate date, List<QueueToken.Status> statuses);
}
