package com.example.courseservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRequest {
    private Long studentId;  // used as generic "userId" — works for instructors too
    private String message;
}
