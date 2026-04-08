package com.krishimitra.backend.market;

import java.time.Instant;

public class MarketAlertResponse {
    private Long alertId;
    private String cropType;
    private String city;
    private double targetPrice;
    private String direction;
    private double currentPrice;
    private boolean triggered;
    private String message;
    private Instant createdAt;

    public MarketAlertResponse(Long alertId,
                               String cropType,
                               String city,
                               double targetPrice,
                               String direction,
                               double currentPrice,
                               boolean triggered,
                               String message,
                               Instant createdAt) {
        this.alertId = alertId;
        this.cropType = cropType;
        this.city = city;
        this.targetPrice = targetPrice;
        this.direction = direction;
        this.currentPrice = currentPrice;
        this.triggered = triggered;
        this.message = message;
        this.createdAt = createdAt;
    }

    public Long getAlertId() {
        return alertId;
    }

    public String getCropType() {
        return cropType;
    }

    public String getCity() {
        return city;
    }

    public double getTargetPrice() {
        return targetPrice;
    }

    public String getDirection() {
        return direction;
    }

    public double getCurrentPrice() {
        return currentPrice;
    }

    public boolean isTriggered() {
        return triggered;
    }

    public String getMessage() {
        return message;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
