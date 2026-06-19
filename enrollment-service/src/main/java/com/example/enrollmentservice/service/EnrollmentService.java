package com.example.enrollmentservice.service;

import com.example.enrollmentservice.dto.EnrollmentRequest;
import com.example.enrollmentservice.dto.NotificationRequest;
import com.example.enrollmentservice.model.Enrollment;
import com.example.enrollmentservice.model.EnrollmentStatus;
import com.example.enrollmentservice.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final RestTemplate restTemplate;

    private static final String NOTIFICATION_URL = "http://localhost:8084/api/notifications";
    private static final String COURSE_URL       = "http://localhost:8082/api/courses";

    @Transactional
    public Enrollment requestEnrollment(EnrollmentRequest request) {
        Enrollment enrollment = Enrollment.builder()
                .courseId(request.getCourseId())
                .studentId(request.getStudentId())
                .status(EnrollmentStatus.PENDING)
                .requestDate(LocalDateTime.now())
                .build();
        Enrollment saved = enrollmentRepository.save(enrollment);
        sendNotification(saved.getStudentId(),
                "Your enrollment request for course #" + saved.getCourseId() + " is pending instructor review.");
        return saved;
    }

    @Transactional
    public Enrollment acceptEnrollment(Long id) {
        Enrollment enrollment = enrollmentRepository.findById(id).orElseThrow();
        enrollment.setStatus(EnrollmentStatus.ACCEPTED);
        enrollment.setResponseDate(LocalDateTime.now());
        Enrollment saved = enrollmentRepository.save(enrollment);

        // increment the course's enrolled-student counter
        try {
            restTemplate.postForObject(
                    COURSE_URL + "/" + enrollment.getCourseId() + "/increment-enrolled",
                    null, Void.class);
        } catch (Exception e) {
            System.err.println("Could not update enrolled count: " + e.getMessage());
        }

        sendNotification(saved.getStudentId(),
                "Your enrollment request for course #" + saved.getCourseId() + " has been accepted!");
        return saved;
    }

    @Transactional
    public Enrollment rejectEnrollment(Long id) {
        Enrollment enrollment = enrollmentRepository.findById(id).orElseThrow();
        enrollment.setStatus(EnrollmentStatus.REJECTED);
        enrollment.setResponseDate(LocalDateTime.now());
        Enrollment saved = enrollmentRepository.save(enrollment);
        sendNotification(saved.getStudentId(),
                "Your enrollment request for course #" + saved.getCourseId() + " has been rejected.");
        return saved;
    }

    @Transactional
    public Enrollment cancelEnrollment(Long id) {
        Enrollment enrollment = enrollmentRepository.findById(id).orElseThrow();
        enrollment.setStatus(EnrollmentStatus.CANCELLED);
        enrollment.setResponseDate(LocalDateTime.now());
        Enrollment saved = enrollmentRepository.save(enrollment);
        sendNotification(saved.getStudentId(),
                "Your enrollment for course #" + saved.getCourseId() + " has been cancelled.");
        return saved;
    }

    public List<Enrollment> getStudentEnrollments(Long studentId) {
        return enrollmentRepository.findByStudentId(studentId);
    }

    public List<Enrollment> getCourseEnrollments(Long courseId) {
        return enrollmentRepository.findByCourseId(courseId);
    }

    private void sendNotification(Long studentId, String message) {
        try {
            restTemplate.postForObject(NOTIFICATION_URL, new NotificationRequest(studentId, message), Object.class);
        } catch (Exception e) {
            System.err.println("Failed to send notification to student " + studentId + ": " + e.getMessage());
        }
    }
}
