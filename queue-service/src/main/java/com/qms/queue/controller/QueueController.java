package com.qms.queue.controller;

import com.qms.queue.entity.QueueToken;
import com.qms.queue.service.QueueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/queue")
@RequiredArgsConstructor
public class QueueController {

    private final QueueService queueService;

    // ============================================================
    // GET QUEUE FOR DOCTOR
    // ============================================================
    @GetMapping("/{doctorId}")
    public ResponseEntity<Map<String, Object>> getQueue(
            @PathVariable Long doctorId,
            @RequestParam(required = false) String date) {

        List<QueueToken> queue =
                queueService.getQueue(doctorId, date);

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "data", queue
                )
        );
    }


    // ============================================================
    // GET CUSTOMER TOKENS
    // ============================================================
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<Map<String, Object>> getCustomerTokens(
            @PathVariable Long customerId) {

        List<QueueToken> tokens =
                queueService.getCustomerTokens(customerId);

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "data", tokens
                )
        );
    }


    // ============================================================
    // GET TOKEN STATUS
    // ============================================================
    @GetMapping("/status/{appointmentId}")
    public ResponseEntity<Map<String, Object>> getTokenStatus(
            @PathVariable Long appointmentId) {

        Map<String, Object> status =
                queueService.getTokenStatus(appointmentId);

        if (status == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "data", status
                )
        );
    }


    // ============================================================
    // CHECK IN PATIENT
    // ============================================================
    @PostMapping("/check-in")
    public ResponseEntity<Map<String, Object>> checkIn(
            @RequestBody Map<String, Long> request) {

        Map<String, Object> result =
                queueService.checkIn(
                        request.get("tokenId")
                );

        return ResponseEntity.ok(result);
    }


    // ============================================================
    // START CONSULTATION
    // ============================================================
    @PostMapping("/{tokenId}/start")
    public ResponseEntity<Map<String, Object>> startConsultation(
            @PathVariable Long tokenId,
            @RequestHeader(
                    value = "X-User-Id",
                    required = false
            ) String userId) {

        Long doctorId =
                userId != null
                        ? Long.parseLong(userId)
                        : null;

        Map<String, Object> result =
                queueService.startConsultation(
                        tokenId,
                        doctorId
                );

        return ResponseEntity.ok(result);
    }


    // ============================================================
    // COMPLETE CONSULTATION
    // ============================================================
    @PostMapping("/{tokenId}/complete")
    public ResponseEntity<Map<String, Object>> complete(
            @PathVariable Long tokenId,
            @RequestHeader(
                    value = "X-User-Id",
                    required = false
            ) String userId) {

        Long doctorId =
                userId != null
                        ? Long.parseLong(userId)
                        : null;

        Map<String, Object> result =
                queueService.complete(
                        tokenId,
                        doctorId
                );

        return ResponseEntity.ok(result);
    }


    // ============================================================
    // CANCEL TOKEN
    // ============================================================
    @PostMapping("/{tokenId}/cancel")
    public ResponseEntity<Map<String, Object>> cancelToken(
            @PathVariable Long tokenId) {

        Map<String, Object> result =
                queueService.cancelToken(tokenId);

        return ResponseEntity.ok(result);
    }


    // ============================================================
    // SKIP TOKEN
    // ============================================================
    @PostMapping("/{tokenId}/skip")
    public ResponseEntity<Map<String, Object>> skipToken(
            @PathVariable Long tokenId) {

        Map<String, Object> result =
                queueService.skipToken(tokenId);

        return ResponseEntity.ok(result);
    }


    // ============================================================
    // AUTOMATIC RESCHEDULE / CANCEL - called by Appointment Service
    // ============================================================
    @PutMapping("/appointment/{appointmentId}/reschedule")
    public ResponseEntity<Map<String, Object>> rescheduleToken(
            @PathVariable Long appointmentId,
            @RequestBody Map<String, Object> request) {

        Integer minutes = request.get("consultationMinutes") == null
                ? null
                : Integer.parseInt(String.valueOf(request.get("consultationMinutes")));

        return ResponseEntity.ok(queueService.rescheduleToken(
                appointmentId,
                LocalDate.parse(String.valueOf(request.get("tokenDate"))),
                String.valueOf(request.get("appointmentTime")),
                String.valueOf(request.get("tokenNumber")),
                Integer.parseInt(String.valueOf(request.get("sequenceNumber"))),
                minutes));
    }

    @PutMapping("/appointment/{appointmentId}/auto-cancel")
    public ResponseEntity<Map<String, Object>> autoCancelToken(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(queueService.autoCancelToken(appointmentId));
    }

    // ============================================================
    // CREATE QUEUE TOKEN
    // Called by Appointment Service
    // ============================================================
    @PostMapping
    public ResponseEntity<Map<String, Object>> createToken(
            @RequestBody Map<String, Object> request) {

        Long appointmentId =
                Long.parseLong(
                        String.valueOf(
                                request.get("appointmentId")
                        )
                );

        Long customerId =
                Long.parseLong(
                        String.valueOf(
                                request.get("customerId")
                        )
                );

        Long doctorId =
                Long.parseLong(
                        String.valueOf(
                                request.get("doctorId")
                        )
                );

        Long doctorProfileId =
                Long.parseLong(
                        String.valueOf(
                                request.get("doctorProfileId")
                        )
                );

        String tokenNumber =
                String.valueOf(
                        request.get("tokenNumber")
                );

        String appointmentTime = request.get("appointmentTime") == null
                ? null
                : String.valueOf(request.get("appointmentTime"));

        int sequenceNumber =
                Integer.parseInt(
                        String.valueOf(
                                request.get("sequenceNumber")
                        )
                );

        Integer consultationMinutes = request.get("consultationMinutes") == null
                ? 10
                : Integer.parseInt(String.valueOf(request.get("consultationMinutes")));

        LocalDate tokenDate =
                LocalDate.parse(
                        String.valueOf(
                                request.get("tokenDate")
                        )
                );

        QueueToken token =
                queueService.createToken(
                        appointmentId,
                        customerId,
                        doctorId,
                        doctorProfileId,
                        tokenDate,
                        tokenNumber,
                        sequenceNumber,
                        consultationMinutes,
                        appointmentTime
                );

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "data", token
                )
        );
    }
}