package com.krishimitra.backend.detection;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "detection_reports")
public class DetectionReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String cropType;
    private String diseaseName;
    private double confidence;
    private String treatment;
    private String severity;
    private double affectedAreaPercent;
    private String farmerEmail;
    private String followUpStatus = "PENDING";
    @Column(length = 1000)
    private String followUpNotes;
    private Instant followUpUpdatedAt;
    private Instant createdAt = Instant.now();

    public DetectionReport() {}

    public DetectionReport(String cropType, String diseaseName, double confidence, String treatment,
                           String severity, double affectedAreaPercent) {
        this(cropType, diseaseName, confidence, treatment, severity, affectedAreaPercent, null);
    }

    public DetectionReport(String cropType, String diseaseName, double confidence, String treatment,
                           String severity, double affectedAreaPercent, String farmerEmail) {
        this.cropType = cropType;
        this.diseaseName = diseaseName;
        this.confidence = confidence;
        this.treatment = treatment;
        this.severity = severity;
        this.affectedAreaPercent = affectedAreaPercent;
        this.farmerEmail = farmerEmail;
    }

    public Long getId() { return id; }
    public String getCropType() { return cropType; }
    public String getDiseaseName() { return diseaseName; }
    public double getConfidence() { return confidence; }
    public String getTreatment() { return treatment; }
    public String getSeverity() { return severity; }
    public double getAffectedAreaPercent() { return affectedAreaPercent; }
    public String getFarmerEmail() { return farmerEmail; }
    public String getFollowUpStatus() { return followUpStatus; }
    public String getFollowUpNotes() { return followUpNotes; }
    public Instant getFollowUpUpdatedAt() { return followUpUpdatedAt; }
    public Instant getCreatedAt() { return createdAt; }

    public void setCropType(String cropType) { this.cropType = cropType; }
    public void setDiseaseName(String diseaseName) { this.diseaseName = diseaseName; }
    public void setConfidence(double confidence) { this.confidence = confidence; }
    public void setTreatment(String treatment) { this.treatment = treatment; }
    public void setSeverity(String severity) { this.severity = severity; }
    public void setAffectedAreaPercent(double affectedAreaPercent) { this.affectedAreaPercent = affectedAreaPercent; }
    public void setFarmerEmail(String farmerEmail) { this.farmerEmail = farmerEmail; }
    public void setFollowUpStatus(String followUpStatus) { this.followUpStatus = followUpStatus; }
    public void setFollowUpNotes(String followUpNotes) { this.followUpNotes = followUpNotes; }
    public void setFollowUpUpdatedAt(Instant followUpUpdatedAt) { this.followUpUpdatedAt = followUpUpdatedAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
