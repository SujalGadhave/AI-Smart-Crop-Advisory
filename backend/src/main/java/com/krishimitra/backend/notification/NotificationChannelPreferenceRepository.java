package com.krishimitra.backend.notification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NotificationChannelPreferenceRepository extends JpaRepository<NotificationChannelPreference, Long> {
    Optional<NotificationChannelPreference> findByFarmerEmail(String farmerEmail);
}