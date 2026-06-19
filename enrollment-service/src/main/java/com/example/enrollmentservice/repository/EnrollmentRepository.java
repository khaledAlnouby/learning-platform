package com.example.enrollmentservice.repository;

import com.example.enrollmentservice.model.Enrollment;
import com.example.enrollmentservice.model.EnrollmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByStudentId(Long studentId);
    List<Enrollment> findByCourseId(Long courseId);
    List<Enrollment> findByCourseIdAndStatus(Long courseId, EnrollmentStatus status);
}
