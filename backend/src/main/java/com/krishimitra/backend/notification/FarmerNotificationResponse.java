package com.krishimitra.backend.notification;

import java.time.Instant;

public class FarmerNotificationResponse {
    private Long notificationId;
    private String type;
    private String level;
    private String title;
    private String message;
    private Long sourceReportId;
    private Instant createdAt;
    private boolean read;

    public FarmerNotificationResponse() {
    }

    public FarmerNotificationResponse(Long notificationId,
                                      String type,
                                      String level,
                                      String title,
                                      String message,
                                      Long sourceReportId,
                                      Instant createdAt,
                                      boolean read) {
        this.notificationId = notificationId;
        this.type = type;
        this.level = level;
        this.title = title;
        this.message = message;
        this.sourceReportId = sourceReportId;
        this.createdAt = createdAt;
        this.read = read;
    }

    public Long getNotificationId() {
        return notificationId;
    }

    public String getType() {
        return type;
    }

    public String getLevel() {
        return level;
    }

    public String getTitle() {
        return title;
    }

    public String getMessage() {
        return message;
    }

    public Long getSourceReportId() {
        return sourceReportId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public boolean isRead() {
        return read;
    }
}