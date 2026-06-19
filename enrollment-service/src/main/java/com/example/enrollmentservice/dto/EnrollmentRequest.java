package com.example.enrollmentservice.dto;

import lombok.Data;

@Data
public class EnrollmentRequest {
    private Long courseId;
    private Long studentId;
}
