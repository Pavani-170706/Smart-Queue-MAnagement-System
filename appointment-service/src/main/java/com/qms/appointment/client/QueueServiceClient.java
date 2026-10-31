package com.qms.appointment.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(name = "queue-service")
public interface QueueServiceClient {

    @PostMapping("/api/queue")
    Map<String, Object> createToken(
            @RequestBody Map<String, Object> request
    );

    @PutMapping("/api/queue/appointment/{appointmentId}/reschedule")
    Map<String, Object> rescheduleToken(
            @PathVariable("appointmentId") Long appointmentId,
            @RequestBody Map<String, Object> request
    );

    @PutMapping("/api/queue/appointment/{appointmentId}/auto-cancel")
    Map<String, Object> autoCancelToken(
            @PathVariable("appointmentId") Long appointmentId
    );
}
