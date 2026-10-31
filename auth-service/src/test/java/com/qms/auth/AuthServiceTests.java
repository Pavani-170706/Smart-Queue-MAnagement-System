package com.qms.auth;

import com.qms.auth.dto.AuthResponse;
import com.qms.auth.dto.LoginRequest;
import com.qms.auth.dto.RegisterRequest;
import com.qms.auth.entity.User;
import com.qms.auth.repository.UserRepository;
import com.qms.auth.security.JwtTokenProvider;
import com.qms.auth.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTests {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setFullName("Test User");
        registerRequest.setEmail("test@example.com");
        registerRequest.setPhone("+1-555-0100");
        registerRequest.setPassword("password123");
        registerRequest.setRole("CUSTOMER");

        loginRequest = new LoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("password123");
    }

    @Test
    void register_Success() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded_password");
        when(userRepository.save(any(User.class))).thenReturn(User.builder().id(1L).build());
        when(jwtTokenProvider.generateToken(anyLong(), anyString(), anyString())).thenReturn("jwt-token");

        AuthResponse response = authService.register(registerRequest);

        assertTrue(response.isSuccess());
        assertNotNull(response.getData());
        assertEquals("jwt-token", response.getData().getToken());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_DuplicateEmail() {
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        AuthResponse response = authService.register(registerRequest);

        assertFalse(response.isSuccess());
        assertEquals("Email already registered", response.getMessage());
    }

    @Test
    void login_Success() {
        User user = User.builder()
                .id(1L)
                .fullName("Test User")
                .email("test@example.com")
                .password("encoded_password")
                .role(User.Role.CUSTOMER)
                .isActive(true)
                .build();

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encoded_password")).thenReturn(true);
        when(jwtTokenProvider.generateToken(anyLong(), anyString(), anyString())).thenReturn("jwt-token");

        AuthResponse response = authService.login(loginRequest);

        assertTrue(response.isSuccess());
        assertEquals("jwt-token", response.getData().getToken());
    }

    @Test
    void login_InvalidEmail() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());

        AuthResponse response = authService.login(loginRequest);

        assertFalse(response.isSuccess());
        assertEquals("Invalid email or password", response.getMessage());
    }

    @Test
    void login_InvalidPassword() {
        User user = User.builder()
                .id(1L)
                .email("test@example.com")
                .password("encoded_password")
                .role(User.Role.CUSTOMER)
                .isActive(true)
                .build();

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encoded_password")).thenReturn(false);

        AuthResponse response = authService.login(loginRequest);

        assertFalse(response.isSuccess());
    }

    @Test
    void login_DeactivatedAccount() {
        User user = User.builder()
                .id(1L)
                .email("test@example.com")
                .password("encoded_password")
                .role(User.Role.CUSTOMER)
                .isActive(false)
                .build();

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encoded_password")).thenReturn(true);

        AuthResponse response = authService.login(loginRequest);

        assertFalse(response.isSuccess());
        assertEquals("Account has been deactivated", response.getMessage());
    }
}
