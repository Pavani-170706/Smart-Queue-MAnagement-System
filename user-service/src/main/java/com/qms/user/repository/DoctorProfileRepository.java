package com.qms.user.repository;

import com.qms.user.entity.DoctorProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorProfileRepository extends JpaRepository<DoctorProfile, Long> {
    Optional<DoctorProfile> findByUserId(Long userId);
    List<DoctorProfile> findByIsActive(Boolean isActive);
    List<DoctorProfile> findBySpecializationAndIsActive(String specialization, Boolean isActive);
    List<DoctorProfile> findByDepartmentAndIsActive(String department, Boolean isActive);
}
