package com.qms.queue.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(name = "appointment-service")
public interface AppointmentServiceClient {
    @PutMapping("/api/appointments/{id}/status")
    Map<String, Object> updateStatus(@PathVariable("id") Long appointmentId, @RequestBody Map<String, String> request);
}
