package com.example.courseservice.controller;

import com.example.courseservice.dto.CourseRequest;
import com.example.courseservice.dto.ReviewRequest;
import com.example.courseservice.model.Course;
import com.example.courseservice.model.CourseStatus;
import com.example.courseservice.model.Review;
import com.example.courseservice.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    // --- Public / Student Endpoints ---

    @GetMapping("/approved")
    public ResponseEntity<List<Course>> getApprovedCourses() {
        return ResponseEntity.ok(courseService.getApprovedCourses());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Course> getCourseById(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.getCourseById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Course>> searchCourses(@RequestParam String keyword) {
        return ResponseEntity.ok(courseService.searchCourses(keyword));
    }

    // --- Instructor Endpoints ---

    @PostMapping
    public ResponseEntity<Course> createCourse(@RequestBody CourseRequest request) {
        return ResponseEntity.ok(courseService.createCourse(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Course> updateCourse(@PathVariable Long id, @RequestBody CourseRequest request) {
        return ResponseEntity.ok(courseService.updateCourse(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long id) {
        courseService.deleteCourse(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/instructor/{instructorId}")
    public ResponseEntity<List<Course>> getCoursesByInstructor(@PathVariable Long instructorId) {
        return ResponseEntity.ok(courseService.getCoursesByInstructor(instructorId));
    }

    @PostMapping("/{id}/increment-enrolled")
    public ResponseEntity<Void> incrementEnrolled(@PathVariable Long id) {
        courseService.incrementEnrolledStudents(id);
        return ResponseEntity.ok().build();
    }

    // --- Admin Endpoints ---

    @GetMapping
    public ResponseEntity<List<Course>> getAllCourses() {
        return ResponseEntity.ok(courseService.getAllCourses());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Course> updateCourseStatus(@PathVariable Long id, @RequestParam CourseStatus status) {
        return ResponseEntity.ok(courseService.updateCourseStatus(id, status));
    }

    // --- Review Endpoints ---

    @PostMapping("/reviews")
    public ResponseEntity<Review> addReview(@RequestBody ReviewRequest request) {
        return ResponseEntity.ok(courseService.addReview(request));
    }

    @GetMapping("/{courseId}/reviews")
    public ResponseEntity<List<Review>> getReviews(@PathVariable Long courseId) {
        return ResponseEntity.ok(courseService.getReviewsForCourse(courseId));
    }
}
