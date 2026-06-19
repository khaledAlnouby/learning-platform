package com.example.courseservice.service;

import com.example.courseservice.dto.CourseRequest;
import com.example.courseservice.dto.NotificationRequest;
import com.example.courseservice.dto.ReviewRequest;
import com.example.courseservice.model.Course;
import com.example.courseservice.model.CourseStatus;
import com.example.courseservice.model.Review;
import com.example.courseservice.repository.CourseRepository;
import com.example.courseservice.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final ReviewRepository reviewRepository;
    private final RestTemplate restTemplate;

    private static final String NOTIFICATION_URL = "http://localhost:8084/api/notifications";

    public Course createCourse(CourseRequest request) {
        Course course = Course.builder()
                .name(request.getName())
                .duration(request.getDuration())
                .category(request.getCategory())
                .capacity(request.getCapacity())
                .instructorId(request.getInstructorId())
                .status(CourseStatus.PENDING) // Needs admin approval
                .build();
        return courseRepository.save(course);
    }

    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }
    
    public List<Course> getApprovedCourses() {
        return courseRepository.findByStatus(CourseStatus.APPROVED);
    }

    public Course getCourseById(Long id) {
        return courseRepository.findById(id).orElseThrow();
    }

    public List<Course> searchCourses(String keyword) {
        return courseRepository.searchCourses(keyword);
    }

    public Course updateCourseStatus(Long id, CourseStatus status) {
        Course course = getCourseById(id);
        course.setStatus(status);
        return courseRepository.save(course);
    }
    
    public Course updateCourse(Long id, CourseRequest request) {
        Course course = getCourseById(id);
        if (request.getName() != null) course.setName(request.getName());
        if (request.getDuration() != null) course.setDuration(request.getDuration());
        if (request.getCategory() != null) course.setCategory(request.getCategory());
        if (request.getCapacity() != null) course.setCapacity(request.getCapacity());
        return courseRepository.save(course);
    }

    public void deleteCourse(Long id) {
        courseRepository.deleteById(id);
    }

    public List<Course> getCoursesByInstructor(Long instructorId) {
        return courseRepository.findByInstructorId(instructorId);
    }

    @Transactional
    public void incrementEnrolledStudents(Long courseId) {
        courseRepository.incrementEnrolledStudents(courseId);
    }
    
    @Transactional
    public Review addReview(ReviewRequest request) {
        Course course = getCourseById(request.getCourseId());

        Review review = Review.builder()
                .courseId(request.getCourseId())
                .studentId(request.getStudentId())
                .rating(request.getRating())
                .comment(request.getComment())
                .build();
        Review savedReview = reviewRepository.save(review);

        // Recalculate and update course average rating
        List<Review> allReviews = reviewRepository.findByCourseId(request.getCourseId());
        double avg = allReviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
        courseRepository.updateRating(request.getCourseId(), avg);

        // Notify the instructor
        try {
            String msg = "Student #" + request.getStudentId() + " gave your course \"" + course.getName()
                    + "\" a " + request.getRating() + "/5 rating."
                    + (request.getComment() != null && !request.getComment().isBlank()
                        ? " Comment: \"" + request.getComment() + "\""
                        : "");
            restTemplate.postForObject(NOTIFICATION_URL,
                    new NotificationRequest(course.getInstructorId(), msg), Object.class);
        } catch (Exception e) {
            System.err.println("Failed to notify instructor: " + e.getMessage());
        }

        return savedReview;
    }
    
    public List<Review> getReviewsForCourse(Long courseId) {
        return reviewRepository.findByCourseId(courseId);
    }
}
