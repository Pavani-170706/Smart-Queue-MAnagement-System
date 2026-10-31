package com.qms.user.controller;

import com.qms.user.entity.DoctorProfile;
import com.qms.user.entity.User;
import com.qms.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/internal/users/sync")
    public ResponseEntity<Map<String, Object>> syncUser(@RequestBody Map<String, Object> request) {
        Long id = request.get("id") == null ? null : Long.valueOf(String.valueOf(request.get("id")));
        String fullName = String.valueOf(request.get("fullName"));
        String email = String.valueOf(request.get("email"));
        String phone = request.get("phone") == null ? null : String.valueOf(request.get("phone"));
        String role = String.valueOf(request.get("role"));
        Boolean isActive = request.get("isActive") == null ? true : Boolean.valueOf(String.valueOf(request.get("isActive")));
        String specialization = request.get("specialization") == null ? null : String.valueOf(request.get("specialization"));
        String department = request.get("department") == null ? null : String.valueOf(request.get("department"));
        String room = request.get("room") == null ? null : String.valueOf(request.get("room"));
        String qualification = request.get("qualification") == null ? null : String.valueOf(request.get("qualification"));
        Integer experience = request.get("experience") == null ? null : Integer.valueOf(String.valueOf(request.get("experience")));

        if (id == null || email.isBlank() || fullName.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Missing required user data"));
        }

        Map<String, Object> synced = userService.syncUser(id, fullName, email, phone, role, isActive, specialization, department, room, qualification, experience);
        return ResponseEntity.ok(Map.of("success", true, "data", synced));
    }

    // ── Doctor Endpoints ─────────────────────────────────────
    @GetMapping("/doctors")
    public ResponseEntity<Map<String, Object>> getDoctors(
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) String department) {
        List<Map<String, Object>> doctors = userService.getAllDoctors().stream()
                .filter(d -> specialization == null || specialization.isBlank() || specialization.equalsIgnoreCase(String.valueOf(((DoctorProfile) d.get("profile")).getSpecialization())))
                .filter(d -> department == null || department.isBlank() || department.equalsIgnoreCase(String.valueOf(((DoctorProfile) d.get("profile")).getDepartment())))
                .toList();
        return ResponseEntity.ok(Map.of("success", true, "data", doctors));
    }

    @GetMapping("/doctors/{userId}")
    public ResponseEntity<Map<String, Object>> getDoctor(@PathVariable Long userId) {
        Map<String, Object> doctor = userService.getDoctorById(userId);
        if (doctor == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of("success", true, "data", doctor));
    }

    @GetMapping("/doctors/specializations")
    public ResponseEntity<Map<String, Object>> getSpecializations() {
        return ResponseEntity.ok(Map.of("success", true, "data", userService.getSpecializations()));
    }

    @GetMapping("/doctors/departments")
    public ResponseEntity<Map<String, Object>> getDepartments() {
        return ResponseEntity.ok(Map.of("success", true, "data", userService.getDepartments()));
    }

    // ── Admin: User Management ───────────────────────────────
    @GetMapping("/admin/customers")
    public ResponseEntity<Map<String, Object>> getCustomers() {
        List<User> customers = userService.getUsersByRole("CUSTOMER");
        return ResponseEntity.ok(Map.of("success", true, "data", customers));
    }

    @GetMapping("/admin/staff")
    public ResponseEntity<Map<String, Object>> getStaff() {
        List<User> doctors = userService.getUsersByRole("DOCTOR");
        List<User> receptionists = userService.getUsersByRole("RECEPTIONIST");
        doctors.addAll(receptionists);
        return ResponseEntity.ok(Map.of("success", true, "data", doctors));
    }

    @PostMapping("/admin/staff")
    public ResponseEntity<Map<String, Object>> createStaff(@RequestBody User user) {
        User created = userService.createUser(user);
        return ResponseEntity.ok(Map.of("success", true, "data", created));
    }

    @PutMapping("/admin/staff/{id}")
    public ResponseEntity<Map<String, Object>> updateStaff(@PathVariable Long id, @RequestBody User user) {
        User updated = userService.updateUser(id, user);
        return ResponseEntity.ok(Map.of("success", true, "data", updated));
    }

    @DeleteMapping("/admin/staff/{id}")
    public ResponseEntity<Map<String, Object>> deleteStaff(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Staff deleted"));
    }


    @PostMapping(value = "/admin/doctors/import-csv", consumes = "multipart/form-data")
    public ResponseEntity<Map<String, Object>> importDoctorsCsv(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Please select a non-empty CSV file"));
        }
        if (file.getOriginalFilename() == null || !file.getOriginalFilename().toLowerCase().endsWith(".csv")) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Only CSV files are supported"));
        }
        int imported = 0;
        List<Map<String, Object>> errors = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String headerLine = reader.readLine();
            if (headerLine == null) return ResponseEntity.badRequest().body(Map.of("success", false, "message", "CSV file is empty"));
            List<String> headers = parseCsvLine(headerLine.replace("\uFEFF", ""));
            int lineNumber = 1;
            String line;
            while ((line = reader.readLine()) != null) {
                lineNumber++;
                if (line.isBlank()) continue;
                try {
                    List<String> values = parseCsvLine(line);
                    if (values.size() != headers.size()) throw new IllegalArgumentException("Column count does not match header");
                    Map<String, String> row = new LinkedHashMap<>();
                    for (int i = 0; i < headers.size(); i++) row.put(headers.get(i).trim(), values.get(i).trim());
                    userService.importDoctorFromDataset(row);
                    imported++;
                } catch (Exception e) {
                    errors.add(Map.of("line", lineNumber, "message", e.getMessage() == null ? "Invalid row" : e.getMessage()));
                }
            }
            Map<String, Object> result = new java.util.HashMap<>();
            result.put("success", errors.isEmpty());
            result.put("imported", imported);
            result.put("failed", errors.size());
            result.put("errors", errors);
            result.put("message", "Imported " + imported + " doctor records; " + errors.size() + " row(s) failed");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Could not read CSV: " + e.getMessage()));
        }
    }

    private List<String> parseCsvLine(String line) {
        List<String> fields = new ArrayList<>();
        StringBuilder field = new StringBuilder();
        boolean quoted = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (quoted && i + 1 < line.length() && line.charAt(i + 1) == '"') { field.append('"'); i++; }
                else quoted = !quoted;
            } else if (c == ',' && !quoted) {
                fields.add(field.toString()); field.setLength(0);
            } else field.append(c);
        }
        if (quoted) throw new IllegalArgumentException("Unclosed quoted field");
        fields.add(field.toString());
        return fields;
    }

    // ── Admin: Doctor Profile Management ─────────────────────
    @PostMapping("/admin/doctors")
    public ResponseEntity<Map<String, Object>> createDoctorProfile(@RequestBody DoctorProfile profile) {
        DoctorProfile created = userService.createDoctorProfile(profile);
        return ResponseEntity.ok(Map.of("success", true, "data", created));
    }

    @PutMapping("/admin/doctors/{profileId}")
    public ResponseEntity<Map<String, Object>> updateDoctorProfile(
            @PathVariable Long profileId, @RequestBody DoctorProfile profile) {
        DoctorProfile updated = userService.updateDoctorProfile(profileId, profile);
        return ResponseEntity.ok(Map.of("success", true, "data", updated));
    }

    // ── Admin: Customer Management ───────────────────────────
    @PutMapping("/admin/customers/{id}/deactivate")
    public ResponseEntity<Map<String, Object>> deactivateCustomer(@PathVariable Long id) {
        userService.updateUser(id, User.builder().isActive(false).build());
        return ResponseEntity.ok(Map.of("success", true, "message", "Customer deactivated"));
    }

    // ── Profile ──────────────────────────────────────────────
    @GetMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> getUser(@PathVariable Long id) {
        User user = userService.getUserById(id);
        if (user == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of("success", true, "data", user));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> updateUser(@PathVariable Long id, @RequestBody User user) {
        User updated = userService.updateUser(id, user);
        return ResponseEntity.ok(Map.of("success", true, "data", updated));
    }
}
