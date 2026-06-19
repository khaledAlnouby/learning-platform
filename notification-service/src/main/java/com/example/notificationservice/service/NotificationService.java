package com.example.notificationservice.service;

import com.example.notificationservice.dto.NotificationRequest;
import com.example.notificationservice.model.Notification;
import com.example.notificationservice.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public Notification createNotification(NotificationRequest request) {
        Notification notification = Notification.builder()
                .studentId(request.getStudentId())
                .message(request.getMessage())
                .build();
        return notificationRepository.save(notification);
    }

    public List<Notification> getNotificationsForStudent(Long studentId) {
        return notificationRepository.findByStudentIdOrderByTimestampDesc(studentId);
    }

    public Notification markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id).orElseThrow();
        notification.setRead(true);
        return notificationRepository.save(notification);
    }
}
