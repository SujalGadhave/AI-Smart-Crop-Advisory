package com.krishimitra.backend.detection;

import java.util.List;

public class DetectionResponse {
    private Long reportId;
    private String cropType;
    private String diseaseName;
    private double confidence;
    private String treatment;
    private String severity;
    private double affectedAreaPercent;
    private List<String> symptoms;
    private boolean healthy;
    // Error fields (non-null only when plant validation fails)
    private Boolean error;
    private String errorCode;
    private String message;

    public DetectionResponse(Long reportId, String cropType, String diseaseName, double confidence,
                             String treatment, String severity, double affectedAreaPercent,
                             List<String> symptoms, boolean healthy) {
        this.reportId = reportId;
        this.cropType = cropType;
        this.diseaseName = diseaseName;
        this.confidence = confidence;
        this.treatment = treatment;
        this.severity = severity;
        this.affectedAreaPercent = affectedAreaPercent;
        this.symptoms = symptoms;
        this.healthy = healthy;
    }

    // Constructor for error responses (not a plant image)
    public DetectionResponse(Boolean error, String errorCode, String message) {
        this.error = error;
        this.errorCode = errorCode;
        this.message = message;
    }

    public Long getReportId() { return reportId; }
    public String getCropType() { return cropType; }
    public String getDiseaseName() { return diseaseName; }
    public double getConfidence() { return confidence; }
    public String getTreatment() { return treatment; }
    public String getSeverity() { return severity; }
    public double getAffectedAreaPercent() { return affectedAreaPercent; }
    public List<String> getSymptoms() { return symptoms; }
    public boolean isHealthy() { return healthy; }
    public Boolean getError() { return error; }
    public String getErrorCode() { return errorCode; }
    public String getMessage() { return message; }
}
