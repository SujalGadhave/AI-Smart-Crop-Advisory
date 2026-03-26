package com.krishimitra.backend.market;

import java.util.List;

public class MarketResponse {
    private String cropType;
    private String city;
    private double currentPrice;
    private List<MarketPoint> trend;

    public MarketResponse(String cropType, String city, double currentPrice, List<MarketPoint> trend) {
        this.cropType = cropType;
        this.city = city;
        this.currentPrice = currentPrice;
        this.trend = trend;
    }

    public String getCropType() { return cropType; }
    public String getCity() { return city; }
    public double getCurrentPrice() { return currentPrice; }
    public List<MarketPoint> getTrend() { return trend; }
}
