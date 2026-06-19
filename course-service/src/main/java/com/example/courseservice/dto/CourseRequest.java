package com.example.courseservice.dto;

import lombok.Data;

@Data
public class CourseRequest {
    private String name;
    private String duration;
    private String category;
    private Integer capacity;
    private Long instructorId;
}
