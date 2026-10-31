package com.qms.queue;

import com.qms.queue.entity.QueueToken;
import com.qms.queue.repository.QueueTokenRepository;
import com.qms.queue.service.QueueService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QueueServiceTests {

    @Mock
    private QueueTokenRepository queueTokenRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private QueueService queueService;

    @Test
    void createToken_Success() {
        QueueToken token = QueueToken.builder()
                .id(1L).appointmentId(10L).customerId(20L)
                .doctorId(30L).doctorProfileId(40L)
                .tokenNumber("C-001").sequenceNumber(1)
                .status(QueueToken.Status.BOOKED).build();
        when(queueTokenRepository.save(any(QueueToken.class))).thenReturn(token);

        QueueToken result = queueService.createToken(10L, 20L, 30L, 40L, "C-001", 1);
        assertNotNull(result);
        assertEquals("C-001", result.getTokenNumber());
    }

    @Test
    void checkIn_Success() {
        QueueToken token = QueueToken.builder()
                .id(1L).doctorId(30L).tokenDate(LocalDate.now())
                .status(QueueToken.Status.BOOKED).build();
        when(queueTokenRepository.findById(1L)).thenReturn(Optional.of(token));
        when(queueTokenRepository.save(any(QueueToken.class))).thenReturn(token);
        when(queueTokenRepository.findByDoctorIdAndTokenDateOrderBySequenceNumber(anyLong(), any(LocalDate.class)))
                .thenReturn(List.of(token));

        Map<String, Object> result = queueService.checkIn(1L);
        assertTrue((boolean) result.get("success"));
        assertEquals(QueueToken.Status.WAITING, token.getStatus());
    }

    @Test
    void checkIn_TokenNotFound() {
        when(queueTokenRepository.findById(999L)).thenReturn(Optional.empty());

        Map<String, Object> result = queueService.checkIn(999L);
        assertFalse((boolean) result.get("success"));
    }

    @Test
    void startConsultation_Success() {
        QueueToken token = QueueToken.builder()
                .id(1L).doctorId(30L).tokenDate(LocalDate.now())
                .status(QueueToken.Status.WAITING).build();
        when(queueTokenRepository.findById(1L)).thenReturn(Optional.of(token));
        when(queueTokenRepository.save(any(QueueToken.class))).thenReturn(token);
        when(queueTokenRepository.findByDoctorIdAndTokenDateOrderBySequenceNumber(anyLong(), any(LocalDate.class)))
                .thenReturn(List.of(token));

        Map<String, Object> result = queueService.startConsultation(1L, 30L);
        assertTrue((boolean) result.get("success"));
        assertEquals(QueueToken.Status.IN_CONSULTATION, token.getStatus());
    }

    @Test
    void startConsultation_WrongDoctor() {
        QueueToken token = QueueToken.builder()
                .id(1L).doctorId(30L).tokenDate(LocalDate.now())
                .status(QueueToken.Status.WAITING).build();
        when(queueTokenRepository.findById(1L)).thenReturn(Optional.of(token));

        Map<String, Object> result = queueService.startConsultation(1L, 99L);
        assertFalse((boolean) result.get("success"));
        assertEquals("Unauthorized", result.get("message"));
    }

    @Test
    void complete_Success() {
        QueueToken token = QueueToken.builder()
                .id(1L).doctorId(30L).tokenDate(LocalDate.now())
                .status(QueueToken.Status.IN_CONSULTATION).build();
        when(queueTokenRepository.findById(1L)).thenReturn(Optional.of(token));
        when(queueTokenRepository.save(any(QueueToken.class))).thenReturn(token);
        when(queueTokenRepository.findByDoctorIdAndTokenDateOrderBySequenceNumber(anyLong(), any(LocalDate.class)))
                .thenReturn(List.of(token));

        Map<String, Object> result = queueService.complete(1L, 30L);
        assertTrue((boolean) result.get("success"));
        assertEquals(QueueToken.Status.COMPLETED, token.getStatus());
    }

    @Test
    void cancelToken_AlreadyCompleted() {
        QueueToken token = QueueToken.builder()
                .id(1L).doctorId(30L).tokenDate(LocalDate.now())
                .status(QueueToken.Status.COMPLETED).build();
        when(queueTokenRepository.findById(1L)).thenReturn(Optional.of(token));

        Map<String, Object> result = queueService.cancelToken(1L);
        assertFalse((boolean) result.get("success"));
    }

    @Test
    void skipToken_Success() {
        QueueToken token = QueueToken.builder()
                .id(1L).doctorId(30L).tokenDate(LocalDate.now())
                .status(QueueToken.Status.WAITING).build();
        when(queueTokenRepository.findById(1L)).thenReturn(Optional.of(token));
        when(queueTokenRepository.save(any(QueueToken.class))).thenReturn(token);
        when(queueTokenRepository.findByDoctorIdAndTokenDateOrderBySequenceNumber(anyLong(), any(LocalDate.class)))
                .thenReturn(List.of(token));

        Map<String, Object> result = queueService.skipToken(1L);
        assertTrue((boolean) result.get("success"));
        assertEquals(QueueToken.Status.SKIPPED, token.getStatus());
    }
}
