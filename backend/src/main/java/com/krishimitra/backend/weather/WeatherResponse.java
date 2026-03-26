package com.krishimitra.backend.weather;

public class WeatherResponse {
    private String city;
    private double temperature;
    private double windSpeed;
    private String condition;
    private String advice;

    public WeatherResponse(String city, double temperature, double windSpeed, String condition, String advice) {
        this.city = city;
        this.temperature = temperature;
        this.windSpeed = windSpeed;
        this.condition = condition;
        this.advice = advice;
    }

    public String getCity() { return city; }
    public double getTemperature() { return temperature; }
    public double getWindSpeed() { return windSpeed; }
    public String getCondition() { return condition; }
    public String getAdvice() { return advice; }
}
