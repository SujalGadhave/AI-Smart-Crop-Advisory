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
    private Instant createdAt = Instant.now();

    public DetectionReport() {}

    public DetectionReport(String cropType, String diseaseName, double confidence, String treatment) {
        this.cropType = cropType;
        this.diseaseName = diseaseName;
        this.confidence = confidence;
        this.treatment = treatment;
    }

    public Long getId() { return id; }
    public String getCropType() { return cropType; }
    public String getDiseaseName() { return diseaseName; }
    public double getConfidence() { return confidence; }
    public String getTreatment() { return treatment; }
    public Instant getCreatedAt() { return createdAt; }

    public void setCropType(String cropType) { this.cropType = cropType; }
    public void setDiseaseName(String diseaseName) { this.diseaseName = diseaseName; }
    public void setConfidence(double confidence) { this.confidence = confidence; }
    public void setTreatment(String treatment) { this.treatment = treatment; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
