package com.example.courseservice.dto;

import lombok.Data;

@Data
public class ReviewRequest {
    private Long courseId;
    private Long studentId;
    private Integer rating;
    private String comment;
}
