package com.krishimitra.backend.notification;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

@Entity
@Table(
        name = "farmer_notifications",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_farmer_notification_source",
                columnNames = {"farmerEmail", "type", "sourceRef"}
        )
)
public class FarmerNotification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String farmerEmail;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String sourceRef;

    private Long sourceReportId;

    @Column(nullable = false)
    private String level;

    @Column(nullable = false, length = 180)
    private String title;

    @Column(nullable = false, length = 600)
    private String message;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    private Instant readAt;

    public FarmerNotification() {
    }

    public FarmerNotification(String farmerEmail,
                              String type,
                              String sourceRef,
                              Long sourceReportId,
                              String level,
                              String title,
                              String message,
                              Instant createdAt) {
        this.farmerEmail = farmerEmail;
        this.type = type;
        this.sourceRef = sourceRef;
        this.sourceReportId = sourceReportId;
        this.level = level;
        this.title = title;
        this.message = message;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getFarmerEmail() {
        return farmerEmail;
    }

    public void setFarmerEmail(String farmerEmail) {
        this.farmerEmail = farmerEmail;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getSourceRef() {
        return sourceRef;
    }

    public void setSourceRef(String sourceRef) {
        this.sourceRef = sourceRef;
    }

    public Long getSourceReportId() {
        return sourceReportId;
    }

    public void setSourceReportId(Long sourceReportId) {
        this.sourceReportId = sourceReportId;
    }

    public String getLevel() {
        return level;
    }

    public void setLevel(String level) {
        this.level = level;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getReadAt() {
        return readAt;
    }

    public void setReadAt(Instant readAt) {
        this.readAt = readAt;
    }

    public boolean isRead() {
        return readAt != null;
    }
}