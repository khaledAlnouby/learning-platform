package com.example.courseservice.repository;

import com.example.courseservice.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByCourseId(Long courseId);
}
