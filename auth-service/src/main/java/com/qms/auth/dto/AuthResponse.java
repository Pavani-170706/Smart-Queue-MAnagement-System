package com.qms.auth.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private boolean success;
    private String message;
    private TokenData data;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TokenData {
        private String token;
        private String role;
        private Long userId;
        private String email;
        private String fullName;
    }

    public static AuthResponse success(String message, TokenData data) {
        return AuthResponse.builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    public static AuthResponse error(String message) {
        return AuthResponse.builder()
                .success(false)
                .message(message)
                .data(null)
                .build();
    }
}
