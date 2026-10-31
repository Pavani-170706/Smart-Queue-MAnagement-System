package com.qms.auth.service;

import com.qms.auth.client.UserServiceClient;
import com.qms.auth.dto.AdminStaffRequest;
import com.qms.auth.dto.AuthResponse;
import com.qms.auth.dto.LoginRequest;
import com.qms.auth.dto.RegisterRequest;
import com.qms.auth.entity.User;
import com.qms.auth.repository.UserRepository;
import com.qms.auth.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserServiceClient userServiceClient;

    public AuthResponse register(RegisterRequest request) {
    if (userRepository.existsByEmail(request.getEmail())) {
        return AuthResponse.error("Email already registered");
    }

    User.Role role;
    try {
        role = User.Role.valueOf(request.getRole().toUpperCase());
    } catch (IllegalArgumentException | NullPointerException e) {
        return AuthResponse.error("Invalid role: " + request.getRole());
    }

    // Safely handle gender
    User.Gender gender = null;

    if (request.getGender() != null && !request.getGender().trim().isEmpty()) {
        try {
            gender = User.Gender.valueOf(
                    request.getGender().trim().toUpperCase()
            );
        } catch (IllegalArgumentException e) {
            return AuthResponse.error("Invalid gender: " + request.getGender());
        }
    }

    User user = User.builder()
            .fullName(request.getFullName())
            .email(request.getEmail())
            .phone(request.getPhone())
            .password(passwordEncoder.encode(request.getPassword()))
            .role(role)
            .gender(gender)
            .address(request.getAddress())
            .isActive(true)
            .build();

    userRepository.save(user);

    Long applicationUserId = syncWithUserService(user, request.getSpecialization(), request.getDepartment(), request.getRoom(), request.getQualification(), null);

    String token = jwtTokenProvider.generateToken(
            applicationUserId,
            user.getEmail(),
            user.getRole().name()
    );

    return AuthResponse.success(
            "Registration successful",
            AuthResponse.TokenData.builder()
                    .token(token)
                    .userId(applicationUserId)
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .role(user.getRole().name())
                    .build()
    );
}

    public AuthResponse createStaff(AdminStaffRequest request) {
        if (request.getFullName() == null || request.getFullName().isBlank()) {
            return AuthResponse.error("Full name is required");
        }
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return AuthResponse.error("Email is required");
        }
        if (request.getPassword() == null || request.getPassword().length() < 6) {
            return AuthResponse.error("Password must be at least 6 characters");
        }

        User.Role role;
        try {
            role = User.Role.valueOf(request.getRole().toUpperCase());
        } catch (Exception e) {
            return AuthResponse.error("Only DOCTOR or RECEPTIONIST can be created here");
        }
        if (role != User.Role.DOCTOR && role != User.Role.RECEPTIONIST) {
            return AuthResponse.error("Only DOCTOR or RECEPTIONIST can be created here");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            return AuthResponse.error("Email already registered");
        }

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .isActive(true)
                .build();

        userRepository.save(user);

        Long applicationUserId = syncWithUserService(
                user,
                request.getSpecialization(),
                request.getDepartment(),
                request.getRoom(),
                request.getQualification(),
                request.getExperience()
        );

        return AuthResponse.success(
                "Staff account created successfully",
                AuthResponse.TokenData.builder()
                        .token("")
                        .userId(applicationUserId)
                        .email(user.getEmail())
                        .fullName(user.getFullName())
                        .role(user.getRole().name())
                        .build()
        );
    }

    public AuthResponse login(LoginRequest request) {
        var userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            return AuthResponse.error("Invalid email or password");
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return AuthResponse.error("Invalid email or password");
        }

        if (!user.getIsActive()) {
            return AuthResponse.error("Account has been deactivated");
        }

        Long applicationUserId = syncWithUserService(user);
        String token = jwtTokenProvider.generateToken(applicationUserId, user.getEmail(), user.getRole().name());

        return AuthResponse.success("Login successful", AuthResponse.TokenData.builder()
                .token(token)
                .userId(applicationUserId)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .build());
    }

    private Long syncWithUserService(User user) {
        return syncWithUserService(user, null, null, null, null, null);
    }

    private Long syncWithUserService(User user, String specialization, String department, String room, String qualification, Integer experience) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("id", user.getId());
            request.put("fullName", user.getFullName());
            request.put("email", user.getEmail());
            request.put("phone", user.getPhone());
            request.put("role", user.getRole().name());
            request.put("isActive", user.getIsActive());
            if (specialization != null && !specialization.isBlank()) request.put("specialization", specialization);
            if (department != null && !department.isBlank()) request.put("department", department);
            if (room != null && !room.isBlank()) request.put("room", room);
            if (qualification != null && !qualification.isBlank()) request.put("qualification", qualification);
            if (experience != null && experience >= 0) request.put("experience", experience);

            Map<String, Object> response = userServiceClient.syncUser(request);
            Object data = response.get("data");
            if (data instanceof Map<?, ?> dataMap && dataMap.get("id") != null) {
                return ((Number) dataMap.get("id")).longValue();
            }
        } catch (Exception e) {
            System.out.println("User service sync skipped: " + e.getMessage());
        }
        return user.getId();
    }

    public User getCurrentUser(Long userId) {
        return userRepository.findById(userId).orElse(null);
    }

    public User getCurrentUserByEmail(String email) {
        if (email == null || email.isBlank()) return null;
        return userRepository.findByEmail(email).orElse(null);
    }
}
