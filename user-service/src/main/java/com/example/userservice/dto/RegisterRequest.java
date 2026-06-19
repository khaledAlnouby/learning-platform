package com.example.userservice.dto;

import com.example.userservice.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private Role role; // ADMIN, INSTRUCTOR, STUDENT
    private String affiliation;
    private String bio;
    private Integer yearsOfExperience; // for instructors
}
