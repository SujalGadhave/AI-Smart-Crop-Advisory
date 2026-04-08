package com.krishimitra.backend.detection;

import java.time.Instant;

public class RiskAlertResponse {
    private Long reportId;
    private String level;
    private String title;
    private String message;
    private String diseaseName;
    private Instant createdAt;
    private Instant dueAt;

    public RiskAlertResponse(Long reportId,
                             String level,
                             String title,
                             String message,
                             String diseaseName,
                             Instant createdAt,
                             Instant dueAt) {
        this.reportId = reportId;
        this.level = level;
        this.title = title;
        this.message = message;
        this.diseaseName = diseaseName;
        this.createdAt = createdAt;
        this.dueAt = dueAt;
    }

    public Long getReportId() {
        return reportId;
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

    public String getDiseaseName() {
        return diseaseName;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getDueAt() {
        return dueAt;
    }
}