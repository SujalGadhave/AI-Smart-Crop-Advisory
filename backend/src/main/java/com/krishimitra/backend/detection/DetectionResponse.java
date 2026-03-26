package com.krishimitra.backend.detection;

public class DetectionResponse {
    private Long reportId;
    private String diseaseName;
    private double confidence;
    private String treatment;

    public DetectionResponse(Long reportId, String diseaseName, double confidence, String treatment) {
        this.reportId = reportId;
        this.diseaseName = diseaseName;
        this.confidence = confidence;
        this.treatment = treatment;
    }

    public Long getReportId() { return reportId; }
    public String getDiseaseName() { return diseaseName; }
    public double getConfidence() { return confidence; }
    public String getTreatment() { return treatment; }
}
