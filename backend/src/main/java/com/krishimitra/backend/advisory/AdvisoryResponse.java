package com.krishimitra.backend.advisory;

import java.util.List;

public class AdvisoryResponse {
    private String cropType;
    private String season;
    private List<String> fertilizer;
    private List<String> irrigation;
    private List<String> pestManagement;
    private List<String> weatherWarnings;

    public AdvisoryResponse(String cropType, String season, List<String> fertilizer, List<String> irrigation,
                            List<String> pestManagement, List<String> weatherWarnings) {
        this.cropType = cropType;
        this.season = season;
        this.fertilizer = fertilizer;
        this.irrigation = irrigation;
        this.pestManagement = pestManagement;
        this.weatherWarnings = weatherWarnings;
    }

    public String getCropType() { return cropType; }
    public String getSeason() { return season; }
    public List<String> getFertilizer() { return fertilizer; }
    public List<String> getIrrigation() { return irrigation; }
    public List<String> getPestManagement() { return pestManagement; }
    public List<String> getWeatherWarnings() { return weatherWarnings; }
}
