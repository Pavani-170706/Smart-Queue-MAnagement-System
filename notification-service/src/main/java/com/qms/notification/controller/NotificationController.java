package com.qms.notification.controller;

import com.qms.notification.entity.Notification;
import com.qms.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> getMyNotifications(@PathVariable Long userId) {
        List<Notification> notifications = notificationService.getMyNotifications(userId);
        return ResponseEntity.ok(Map.of("success", true, "data", notifications));
    }

    @GetMapping("/{userId}/unread-count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(@PathVariable Long userId) {
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(Map.of("success", true, "data", count));
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(
            @PathVariable Long notificationId,
            @RequestParam Long userId) {
        notificationService.markAsRead(notificationId, userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Notification marked as read"));
    }

    @PutMapping("/{userId}/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead(@PathVariable Long userId) {
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(Map.of("success", true, "message", "All notifications marked as read"));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createNotification(@RequestBody Map<String, Object> request) {
        Notification notification = notificationService.createNotification(
            Long.parseLong(String.valueOf(request.get("userId"))),
            (String) request.get("title"),
            (String) request.get("message"),
            Notification.NotificationType.valueOf((String) request.get("type")),
            request.get("appointmentId") != null ? Long.parseLong(String.valueOf(request.get("appointmentId"))) : null
        );
        return ResponseEntity.ok(Map.of("success", true, "data", notification));
    }
}
