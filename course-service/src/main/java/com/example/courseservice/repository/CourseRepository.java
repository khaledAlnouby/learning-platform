package com.example.courseservice.repository;

import com.example.courseservice.model.Course;
import com.example.courseservice.model.CourseStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByStatus(CourseStatus status);

    @Query("SELECT c FROM Course c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(c.category) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Course> searchCourses(@Param("keyword") String keyword);

    List<Course> findByInstructorId(Long instructorId);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Course c SET c.enrolledStudents = c.enrolledStudents + 1 WHERE c.id = :courseId")
    void incrementEnrolledStudents(@Param("courseId") Long courseId);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Course c SET c.rating = :rating WHERE c.id = :courseId")
    void updateRating(@Param("courseId") Long courseId, @Param("rating") double rating);
}
