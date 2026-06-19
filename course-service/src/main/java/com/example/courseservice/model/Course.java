package com.example.courseservice.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "courses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String duration;

    private String category;

    @Column(nullable = false)
    private Integer capacity;

    @Builder.Default
    @Column(nullable = false)
    private Integer enrolledStudents = 0;

    @Builder.Default
    @Column(nullable = false)
    private Double rating = 0.0;

    @Column(nullable = false)
    private Long instructorId;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private CourseStatus status = CourseStatus.PENDING;
}
