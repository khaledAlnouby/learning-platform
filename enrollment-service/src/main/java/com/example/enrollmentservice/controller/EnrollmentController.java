package com.example.enrollmentservice.controller;

import com.example.enrollmentservice.dto.EnrollmentRequest;
import com.example.enrollmentservice.model.Enrollment;
import com.example.enrollmentservice.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @PostMapping
    public ResponseEntity<Enrollment> requestEnrollment(@RequestBody EnrollmentRequest request) {
        return ResponseEntity.ok(enrollmentService.requestEnrollment(request));
    }

    @PatchMapping("/{id}/accept")
    public ResponseEntity<Enrollment> acceptEnrollment(@PathVariable Long id) {
        return ResponseEntity.ok(enrollmentService.acceptEnrollment(id));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<Enrollment> rejectEnrollment(@PathVariable Long id) {
        return ResponseEntity.ok(enrollmentService.rejectEnrollment(id));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Enrollment> cancelEnrollment(@PathVariable Long id) {
        return ResponseEntity.ok(enrollmentService.cancelEnrollment(id));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Enrollment>> getStudentEnrollments(@PathVariable Long studentId) {
        return ResponseEntity.ok(enrollmentService.getStudentEnrollments(studentId));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<Enrollment>> getCourseEnrollments(@PathVariable Long courseId) {
        return ResponseEntity.ok(enrollmentService.getCourseEnrollments(courseId));
    }
}
