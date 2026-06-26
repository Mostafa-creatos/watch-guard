package com.watchguard.sharedexpenses.service;

import com.watchguard.sharedexpenses.model.Notification;
import com.watchguard.sharedexpenses.model.NotificationType;
import com.watchguard.sharedexpenses.model.User;
import com.watchguard.sharedexpenses.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getUnreadUserNotifications(Long userId) {
        return notificationRepository.findByUserIdAndReadOrderByCreatedAtDesc(userId, false);
    }

    @Transactional
    public void createNotification(User user, String message, NotificationType type) {
        createNotification(user, message, type, null, null);
    }

    @Transactional
    public void createNotification(User user, String message, NotificationType type, Long targetId, String targetType) {
        Notification notification = Notification.builder()
                .user(user)
                .message(message)
                .type(type)
                .read(false)
                .targetId(targetId)
                .targetType(targetType)
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndReadOrderByCreatedAtDesc(userId, false);
        for (Notification n : unread) {
            n.setRead(true);
        }
        notificationRepository.saveAll(unread);
    }
}
