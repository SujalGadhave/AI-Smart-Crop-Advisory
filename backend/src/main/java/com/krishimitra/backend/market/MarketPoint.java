package com.krishimitra.backend.market;

public class MarketPoint {
    private String date;
    private double price;

    public MarketPoint(String date, double price) {
        this.date = date;
        this.price = price;
    }

    public String getDate() { return date; }
    public double getPrice() { return price; }
}
