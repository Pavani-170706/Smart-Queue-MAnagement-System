package com.qms.appointment;

import com.qms.appointment.client.UserServiceClient;
import com.qms.appointment.entity.Appointment;
import com.qms.appointment.repository.AppointmentRepository;
import com.qms.appointment.service.AppointmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTests {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private UserServiceClient userServiceClient;

    @InjectMocks
    private AppointmentService appointmentService;

    @Test
    void getAllowedDates_ReturnsThreeDays() {
        List<String> dates = appointmentService.getAllowedDates();
        assertEquals(3, dates.size());
        assertEquals(LocalDate.now().toString(), dates.get(0));
        assertEquals(LocalDate.now().plusDays(1).toString(), dates.get(1));
        assertEquals(LocalDate.now().plusDays(2).toString(), dates.get(2));
    }

    @Test
    void generateTimeSlots_ReturnsCorrectSlots() {
        List<String> slots = appointmentService.generateTimeSlots("09:00", "12:00", 30);
        assertEquals(6, slots.size());
        assertEquals("09:00", slots.get(0));
        assertEquals("09:30", slots.get(1));
        assertEquals("11:30", slots.get(5));
    }

    @Test
    void getMyAppointments_ReturnsList() {
        List<Appointment> mockAppointments = List.of(
            Appointment.builder().id(1L).customerId(10L).status(Appointment.Status.BOOKED).build(),
            Appointment.builder().id(2L).customerId(10L).status(Appointment.Status.COMPLETED).build()
        );
        when(appointmentRepository.findByCustomerIdOrderByCreatedAtDesc(10L)).thenReturn(mockAppointments);

        List<Appointment> result = appointmentService.getMyAppointments(10L);
        assertEquals(2, result.size());
    }

    @Test
    void getAppointment_Exists() {
        Appointment apt = Appointment.builder().id(1L).customerId(10L).build();
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(apt));

        Appointment result = appointmentService.getAppointment(1L);
        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void getAppointment_NotExists() {
        when(appointmentRepository.findById(999L)).thenReturn(Optional.empty());

        Appointment result = appointmentService.getAppointment(999L);
        assertNull(result);
    }

    @Test
    void cancelAppointment_Success() {
        Appointment apt = Appointment.builder()
                .id(1L).customerId(10L).status(Appointment.Status.BOOKED).build();
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(apt));
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(apt);

        Map<String, Object> result = appointmentService.cancelAppointment(1L, 10L);
        assertTrue((boolean) result.get("success"));
    }

    @Test
    void cancelAppointment_WrongUser() {
        Appointment apt = Appointment.builder()
                .id(1L).customerId(10L).status(Appointment.Status.BOOKED).build();
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(apt));

        Map<String, Object> result = appointmentService.cancelAppointment(1L, 99L);
        assertFalse((boolean) result.get("success"));
        assertEquals("Unauthorized", result.get("message"));
    }

    @Test
    void cancelAppointment_AlreadyCompleted() {
        Appointment apt = Appointment.builder()
                .id(1L).customerId(10L).status(Appointment.Status.COMPLETED).build();
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(apt));

        Map<String, Object> result = appointmentService.cancelAppointment(1L, 10L);
        assertFalse((boolean) result.get("success"));
    }

    @Test
    void bookAppointment_InvalidDate() {
        Map<String, Object> result = appointmentService.bookAppointment(1L, 1L, "2020-01-01", "09:00");
        assertFalse((boolean) result.get("success"));
    }
}
