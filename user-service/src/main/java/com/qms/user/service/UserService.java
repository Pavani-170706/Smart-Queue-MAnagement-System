package com.qms.user.service;

import com.qms.user.entity.DoctorProfile;
import com.qms.user.entity.User;
import com.qms.user.repository.DoctorProfileRepository;
import com.qms.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final DoctorProfileRepository doctorProfileRepository;


    public Map<String, Object> syncUser(Long id, String fullName, String email, String phone, String role, Boolean isActive, String specialization, String department, String room, String qualification, Integer experience) {
        User.Role userRole = User.Role.valueOf(role.toUpperCase());
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            User existingIdUser = userRepository.findById(id).orElse(null);
            User.UserBuilder builder = User.builder()
                    .fullName(fullName)
                    .email(email)
                    .phone(phone)
                    .role(userRole)
                    .isActive(isActive == null || isActive);
            if (existingIdUser == null) {
                builder.id(id);
            }
            user = builder.build();
        } else {
            user.setFullName(fullName);
            user.setPhone(phone);
            user.setRole(userRole);
            user.setIsActive(isActive == null || isActive);
        }

        user = userRepository.save(user);

        if (userRole == User.Role.DOCTOR && doctorProfileRepository.findByUserId(user.getId()).isEmpty()) {
            DoctorProfile profile = DoctorProfile.builder()
                    .userId(user.getId())
                    .specialization(specialization == null || specialization.isBlank() ? "General Medicine" : specialization)
                    .department(department == null || department.isBlank() ? "General Medicine" : department)
                    .room(room == null || room.isBlank() ? "GM-101" : room)
                    .experience(experience == null || experience < 0 ? 0 : experience)
                    .bio("Doctor available for hospital consultations.")
                    .qualification(qualification == null || qualification.isBlank() ? "MBBS" : qualification)
                    .workingDays("MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY")
                    .workingHoursStart(java.time.LocalTime.of(9, 0))
                    .workingHoursEnd(java.time.LocalTime.of(17, 0))
                    .maxDailyAppointments(20)
                    .averageConsultationTime(10)
                    .isActive(true)
                    .build();
            doctorProfileRepository.save(profile);
        } else if (userRole == User.Role.DOCTOR) {
            DoctorProfile profile = doctorProfileRepository.findByUserId(user.getId()).orElse(null);
            if (profile != null) {
                profile.setWorkingDays("MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY");
                if (specialization != null && !specialization.isBlank()) profile.setSpecialization(specialization);
                if (department != null && !department.isBlank()) profile.setDepartment(department);
                if (room != null && !room.isBlank()) profile.setRoom(room);
                if (qualification != null && !qualification.isBlank()) profile.setQualification(qualification);
                if (experience != null && experience >= 0) profile.setExperience(experience);
                doctorProfileRepository.save(profile);
            }
        }

        return Map.of("id", user.getId(), "role", user.getRole().name());
    }


    @Transactional
    public Map<String, Object> importDoctorFromDataset(Map<String, String> row) {
        String fullName = required(row, "fullName");
        String email = required(row, "email").toLowerCase(Locale.ROOT);
        String roleText = row.getOrDefault("role", "DOCTOR").trim();
        if (!"DOCTOR".equalsIgnoreCase(roleText)) {
            throw new IllegalArgumentException("role must be DOCTOR");
        }
        User user = userRepository.findByEmail(email).orElseGet(() -> User.builder()
                .fullName(fullName).email(email).role(User.Role.DOCTOR).isActive(true).build());
        user.setFullName(fullName);
        user.setRole(User.Role.DOCTOR);
        user.setPhone(blankToNull(row.get("phone")));
        user.setIsActive(Boolean.parseBoolean(row.getOrDefault("isActive", "true").trim()));
        user = userRepository.save(user);

        DoctorProfile profile = doctorProfileRepository.findByUserId(user.getId()).orElse(null);
        if (profile == null) profile = DoctorProfile.builder().userId(user.getId()).build();
        profile.setUserId(user.getId());
        profile.setSpecialization(defaultValue(row.get("specialization"), "General Medicine"));
        profile.setDepartment(defaultValue(row.get("department"), "General Medicine"));
        profile.setRoom(defaultValue(row.get("room"), "TBD"));
        profile.setExperience(parseNonNegativeInt(row.get("experience"), 0, "experience"));
        profile.setQualification(defaultValue(row.get("qualification"), "MBBS"));
        profile.setBio(defaultValue(row.get("bio"), "Hospital consultation profile."));
        profile.setWorkingDays(defaultValue(row.get("workingDays"), "MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY"));
        profile.setWorkingHoursStart(parseTime(row.get("workingHoursStart"), "09:00"));
        profile.setWorkingHoursEnd(parseTime(row.get("workingHoursEnd"), "17:00"));
        if (!profile.getWorkingHoursEnd().isAfter(profile.getWorkingHoursStart())) {
            throw new IllegalArgumentException("workingHoursEnd must be after workingHoursStart");
        }
        profile.setMaxDailyAppointments(parseNonNegativeInt(row.get("maxDailyAppointments"), 20, "maxDailyAppointments"));
        profile.setAverageConsultationTime(Math.max(1, parseNonNegativeInt(row.get("averageConsultationTime"), 10, "averageConsultationTime")));
        profile.setIsActive(user.getIsActive());
        doctorProfileRepository.save(profile);
        Map<String, Object> result = new HashMap<>();
        result.put("id", user.getId());
        result.put("fullName", user.getFullName());
        result.put("email", user.getEmail());
        result.put("department", profile.getDepartment());
        result.put("createdOrUpdated", true);
        return result;
    }

    private static String required(Map<String, String> row, String key) {
        String value = row.get(key);
        if (value == null || value.isBlank()) throw new IllegalArgumentException("Missing required field: " + key);
        return value.trim();
    }
    private static String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private static String defaultValue(String value, String fallback) { return value == null || value.isBlank() ? fallback : value.trim(); }
    private static int parseNonNegativeInt(String value, int fallback, String field) {
        if (value == null || value.isBlank()) return fallback;
        try { int parsed = Integer.parseInt(value.trim()); if (parsed < 0) throw new IllegalArgumentException(field + " cannot be negative"); return parsed; }
        catch (NumberFormatException e) { throw new IllegalArgumentException("Invalid number for " + field); }
    }
    private static java.time.LocalTime parseTime(String value, String fallback) {
        try { return java.time.LocalTime.parse(defaultValue(value, fallback).trim()); }
        catch (java.time.format.DateTimeParseException e) { throw new IllegalArgumentException("Time must use HH:mm format"); }
    }

    // ── User Operations ──────────────────────────────────────
    public User createUser(User user) {
        return userRepository.save(user);
    }

    public User getUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<User> getUsersByRole(String role) {
        return userRepository.findByRole(User.Role.valueOf(role.toUpperCase()));
    }

    public List<User> getActiveDoctors() {
        return userRepository.findByRoleAndIsActive(User.Role.DOCTOR, true);
    }

    public User updateUser(Long id, User updated) {
        User user = userRepository.findById(id).orElseThrow(() ->
            new RuntimeException("User not found"));
        if (updated.getFullName() != null) user.setFullName(updated.getFullName());
        if (updated.getPhone() != null) user.setPhone(updated.getPhone());
        if (updated.getIsActive() != null) user.setIsActive(updated.getIsActive());
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    // ── Doctor Profile Operations ────────────────────────────
    public DoctorProfile createDoctorProfile(DoctorProfile profile) {
        return doctorProfileRepository.save(profile);
    }

    public DoctorProfile getDoctorProfileByUserId(Long userId) {
        return doctorProfileRepository.findByUserId(userId).orElse(null);
    }

    public List<Map<String, Object>> getAllDoctors() {
        List<DoctorProfile> profiles = doctorProfileRepository.findByIsActive(true);
        return profiles.stream().map(profile -> {
            Map<String, Object> doctor = new HashMap<>();
            doctor.put("profile", profile);
            User user = userRepository.findById(profile.getUserId()).orElse(null);
            doctor.put("user", user);
            return doctor;
        }).filter(d -> d.get("user") != null).collect(Collectors.toList());
    }

    public Map<String, Object> getDoctorById(Long userId) {
        DoctorProfile profile = doctorProfileRepository.findByUserId(userId).orElse(null);
        if (profile == null) return null;
        User user = userRepository.findById(userId).orElse(null);
        Map<String, Object> doctor = new HashMap<>();
        doctor.put("profile", profile);
        doctor.put("user", user);
        return doctor;
    }

    public List<String> getSpecializations() {
        return doctorProfileRepository.findByIsActive(true).stream()
            .map(DoctorProfile::getSpecialization)
            .distinct()
            .sorted()
            .collect(Collectors.toList());
    }

    public List<String> getDepartments() {
        return doctorProfileRepository.findByIsActive(true).stream()
            .map(DoctorProfile::getDepartment)
            .distinct()
            .sorted()
            .collect(Collectors.toList());
    }

    public DoctorProfile updateDoctorProfile(Long profileId, DoctorProfile updated) {
        DoctorProfile profile = doctorProfileRepository.findById(profileId).orElseThrow(() ->
            new RuntimeException("Doctor profile not found"));
        if (updated.getSpecialization() != null) profile.setSpecialization(updated.getSpecialization());
        if (updated.getDepartment() != null) profile.setDepartment(updated.getDepartment());
        if (updated.getRoom() != null) profile.setRoom(updated.getRoom());
        if (updated.getExperience() != null) profile.setExperience(updated.getExperience());
        if (updated.getBio() != null) profile.setBio(updated.getBio());
        if (updated.getQualification() != null) profile.setQualification(updated.getQualification());
        if (updated.getWorkingDays() != null) profile.setWorkingDays(updated.getWorkingDays());
        if (updated.getWorkingHoursStart() != null) profile.setWorkingHoursStart(updated.getWorkingHoursStart());
        if (updated.getWorkingHoursEnd() != null) profile.setWorkingHoursEnd(updated.getWorkingHoursEnd());
        if (updated.getMaxDailyAppointments() != null) profile.setMaxDailyAppointments(updated.getMaxDailyAppointments());
        if (updated.getAverageConsultationTime() != null) profile.setAverageConsultationTime(updated.getAverageConsultationTime());
        if (updated.getIsActive() != null) profile.setIsActive(updated.getIsActive());
        return doctorProfileRepository.save(profile);
    }
}
