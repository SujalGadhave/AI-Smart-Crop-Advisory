package com.krishimitra.backend.market;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "market_price_alerts")
public class MarketPriceAlert {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String farmerEmail;

    @Column(nullable = false)
    private String cropType;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private double targetPrice;

    @Column(nullable = false)
    private String direction;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public MarketPriceAlert() {
    }

    public MarketPriceAlert(String farmerEmail, String cropType, String city, double targetPrice, String direction) {
        this.farmerEmail = farmerEmail;
        this.cropType = cropType;
        this.city = city;
        this.targetPrice = targetPrice;
        this.direction = direction;
    }

    public Long getId() {
        return id;
    }

    public String getFarmerEmail() {
        return farmerEmail;
    }

    public void setFarmerEmail(String farmerEmail) {
        this.farmerEmail = farmerEmail;
    }

    public String getCropType() {
        return cropType;
    }

    public void setCropType(String cropType) {
        this.cropType = cropType;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public double getTargetPrice() {
        return targetPrice;
    }

    public void setTargetPrice(double targetPrice) {
        this.targetPrice = targetPrice;
    }

    public String getDirection() {
        return direction;
    }

    public void setDirection(String direction) {
        this.direction = direction;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
