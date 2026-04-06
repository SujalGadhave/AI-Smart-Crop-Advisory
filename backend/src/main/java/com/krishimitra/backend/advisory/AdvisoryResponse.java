package com.krishimitra.backend.advisory;

import java.util.List;

public class AdvisoryResponse {
    private String cropType;
    private String season;
    private String diseaseName;
    private List<String> fertilizer;
    private List<String> irrigation;
    private List<String> pestManagement;
    private List<String> weatherWarnings;
    private List<String> diseaseAdvice;

    public AdvisoryResponse(String cropType, String season, List<String> fertilizer, List<String> irrigation,
                            List<String> pestManagement, List<String> weatherWarnings) {
        this(cropType, season, null, fertilizer, irrigation, pestManagement, weatherWarnings, List.of());
    }

    public AdvisoryResponse(String cropType, String season, String diseaseName, List<String> fertilizer, List<String> irrigation,
                            List<String> pestManagement, List<String> weatherWarnings, List<String> diseaseAdvice) {
        this.cropType = cropType;
        this.season = season;
        this.diseaseName = diseaseName;
        this.fertilizer = fertilizer;
        this.irrigation = irrigation;
        this.pestManagement = pestManagement;
        this.weatherWarnings = weatherWarnings;
        this.diseaseAdvice = diseaseAdvice;
    }

    public String getCropType() { return cropType; }
    public String getSeason() { return season; }
    public String getDiseaseName() { return diseaseName; }
    public List<String> getFertilizer() { return fertilizer; }
    public List<String> getIrrigation() { return irrigation; }
    public List<String> getPestManagement() { return pestManagement; }
    public List<String> getWeatherWarnings() { return weatherWarnings; }
    public List<String> getDiseaseAdvice() { return diseaseAdvice; }
}
