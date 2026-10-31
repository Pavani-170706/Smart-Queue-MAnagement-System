package com.qms.auth.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminStaffRequest {
    private String fullName;
    private String email;
    private String phone;
    private String password;
    private String role;
    private String specialization;
    private String department;
    private String room;
    private String qualification;
    private Integer experience;
}
