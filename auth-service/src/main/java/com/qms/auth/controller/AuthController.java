package com.qms.auth.controller;

import com.qms.auth.dto.AdminStaffRequest;
import com.qms.auth.dto.AuthResponse;
import com.qms.auth.dto.LoginRequest;
import com.qms.auth.dto.RegisterRequest;
import com.qms.auth.entity.User;
import com.qms.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    @PostMapping("/admin/staff")
    public ResponseEntity<AuthResponse> createStaff(
            @RequestHeader(value = "X-User-Role", required = false) String adminRole,
            @RequestBody AdminStaffRequest request) {
        if (!"ADMIN".equalsIgnoreCase(adminRole)) {
            return ResponseEntity.status(403).body(AuthResponse.error("Admin access required"));
        }
        AuthResponse response = authService.createStaff(request);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.badRequest().body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.badRequest().body(response);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(@RequestHeader(value = "X-User-Id", required = false) String userId,
                                                           @RequestHeader(value = "X-User-Email", required = false) String email) {
        User user = authService.getCurrentUserByEmail(email);
        if (user == null && userId != null) {
            user = authService.getCurrentUser(Long.parseLong(userId));
        }
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", Map.of(
                "id", user.getId(),
                "fullName", user.getFullName(),
                "email", user.getEmail(),
                "phone", user.getPhone() != null ? user.getPhone() : "",
                "role", user.getRole().name(),
                "gender", user.getGender() != null ? user.getGender().name() : "",
                "address", user.getAddress() != null ? user.getAddress() : "",
                "isActive", user.getIsActive()
            )
        ));
    }
}
