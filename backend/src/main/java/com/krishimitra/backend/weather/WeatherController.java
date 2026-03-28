package com.krishimitra.backend.weather;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/weather")
@CrossOrigin(origins = "*")
public class WeatherController {

    private static final Logger log = LoggerFactory.getLogger(WeatherController.class);
    private final RestTemplate restTemplate;

    public WeatherController(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @GetMapping
    public WeatherResponse getWeather(@RequestParam("city") String city) {
        String url = "https://api.open-meteo.com/v1/forecast?latitude=18.5204&longitude=73.8567&current_weather=true";
        double temperature = 30;
        double windSpeed = 2.5;
        String condition = "Clear";
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response != null && response.containsKey("current_weather")) {
                Map<String, Object> current = (Map<String, Object>) response.get("current_weather");
                Object temp = current.get("temperature");
                Object wind = current.get("windspeed");
                Object code = current.get("weathercode");
                if (temp instanceof Number) temperature = ((Number) temp).doubleValue();
                if (wind instanceof Number) windSpeed = ((Number) wind).doubleValue();
                condition = code != null ? code.toString() : condition;
            }
        } catch (Exception e) {
            log.warn("Weather fallback", e);
        }
        String advice = temperature > 32 ? "High temp: irrigate in morning/evening." : "Mild conditions: maintain regular schedule.";
        return new WeatherResponse(city, temperature, windSpeed, condition, advice);
    }
}
