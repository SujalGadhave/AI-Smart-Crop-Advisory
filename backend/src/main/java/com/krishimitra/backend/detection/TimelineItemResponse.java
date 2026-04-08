package com.krishimitra.backend.detection;

import java.time.Instant;
import java.util.List;

public class TimelineItemResponse {
    private Long reportId;
    private String cropType;
    private String diseaseName;
    private double confidence;
    private String treatment;
    private String severity;
    private double affectedAreaPercent;
    private Instant createdAt;
    private String followUpStatus;
    private String followUpNotes;
    private Instant followUpUpdatedAt;
    private Instant nextFollowUpAt;
    private List<Instant> reminderSchedule;

    public TimelineItemResponse(Long reportId,
                                String cropType,
                                String diseaseName,
                                double confidence,
                                String treatment,
                                String severity,
                                double affectedAreaPercent,
                                Instant createdAt,
                                String followUpStatus,
                                String followUpNotes,
                                Instant followUpUpdatedAt,
                                Instant nextFollowUpAt,
                                List<Instant> reminderSchedule) {
        this.reportId = reportId;
        this.cropType = cropType;
        this.diseaseName = diseaseName;
        this.confidence = confidence;
        this.treatment = treatment;
        this.severity = severity;
        this.affectedAreaPercent = affectedAreaPercent;
        this.createdAt = createdAt;
        this.followUpStatus = followUpStatus;
        this.followUpNotes = followUpNotes;
        this.followUpUpdatedAt = followUpUpdatedAt;
        this.nextFollowUpAt = nextFollowUpAt;
        this.reminderSchedule = reminderSchedule;
    }

    public Long getReportId() {
        return reportId;
    }

    public String getCropType() {
        return cropType;
    }

    public String getDiseaseName() {
        return diseaseName;
    }

    public double getConfidence() {
        return confidence;
    }

    public String getTreatment() {
        return treatment;
    }

    public String getSeverity() {
        return severity;
    }

    public double getAffectedAreaPercent() {
        return affectedAreaPercent;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public String getFollowUpStatus() {
        return followUpStatus;
    }

    public String getFollowUpNotes() {
        return followUpNotes;
    }

    public Instant getFollowUpUpdatedAt() {
        return followUpUpdatedAt;
    }

    public Instant getNextFollowUpAt() {
        return nextFollowUpAt;
    }

    public List<Instant> getReminderSchedule() {
        return reminderSchedule;
    }
}
