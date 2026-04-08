package com.krishimitra.backend.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface FarmerNotificationRepository extends JpaRepository<FarmerNotification, Long> {
    List<FarmerNotification> findTop100ByFarmerEmailOrderByCreatedAtDesc(String farmerEmail);

    boolean existsByFarmerEmailAndTypeAndSourceRef(String farmerEmail, String type, String sourceRef);

    Optional<FarmerNotification> findByIdAndFarmerEmail(Long id, String farmerEmail);

    long countByFarmerEmailAndReadAtIsNull(String farmerEmail);

    @Modifying
    @Query("update FarmerNotification n set n.readAt = :readAt where n.farmerEmail = :farmerEmail and n.readAt is null")
    int markAllAsRead(@Param("farmerEmail") String farmerEmail, @Param("readAt") Instant readAt);
}