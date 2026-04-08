package com.krishimitra.backend.notification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationDeliveryAttemptRepository extends JpaRepository<NotificationDeliveryAttempt, Long> {
    List<NotificationDeliveryAttempt> findTop100ByFarmerEmailOrderByAttemptedAtDesc(String farmerEmail);

    List<NotificationDeliveryAttempt> findByFarmerEmailAndAttemptedAtAfterOrderByAttemptedAtDesc(String farmerEmail,
                                                                                                   java.time.Instant attemptedAt);

    Optional<NotificationDeliveryAttempt> findByIdAndFarmerEmail(Long id, String farmerEmail);

    Optional<NotificationDeliveryAttempt> findTopByChannelAndProviderRefOrderByAttemptedAtDesc(String channel,
                                                                                                 String providerRef);
}