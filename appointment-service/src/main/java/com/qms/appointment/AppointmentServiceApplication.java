package com.qms.appointment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.time.ZoneId;
import java.util.TimeZone;

@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
@EnableScheduling
public class AppointmentServiceApplication {

    public static void main(String[] args) {
        // All appointment/reminder/reschedule logic runs in Indian time,
        // independent of the host/container timezone.
        TimeZone.setDefault(TimeZone.getTimeZone(
                ZoneId.of(System.getProperty("qms.timezone", "Asia/Kolkata"))));
        SpringApplication.run(
                AppointmentServiceApplication.class,
                args
        );
    }
}