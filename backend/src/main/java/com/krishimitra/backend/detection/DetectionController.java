package com.krishimitra.backend.detection;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/crop")
@CrossOrigin(origins = "*")
public class DetectionController {

    private static final Logger log = LoggerFactory.getLogger(DetectionController.class);
    private final RestTemplate restTemplate;
    private final DetectionReportRepository repository;

    @Value("${ai.service.url:http://localhost:8000/predict}")
    private String aiServiceUrl;

    public DetectionController(RestTemplate restTemplate, DetectionReportRepository repository) {
        this.restTemplate = restTemplate;
        this.repository = repository;
    }

    @PostMapping("/detect")
    public ResponseEntity<DetectionResponse> detect(@Valid @RequestBody DetectionRequest request) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("crop_type", request.getCropType());
        payload.put("image_base64", request.getImageBase64());
        String diseaseName = "Unknown";
        double confidence = 0.42;

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(aiServiceUrl, payload, Map.class);
            if (response != null) {
                diseaseName = (String) response.getOrDefault("disease", diseaseName);
                Object conf = response.get("confidence");
                if (conf instanceof Number) {
                    confidence = ((Number) conf).doubleValue();
                }
            }
        } catch (Exception e) {
            log.warn("AI service not reachable, using fallback", e);
        }

        String treatment = switch (diseaseName.toLowerCase()) {
            case "early_blight" -> "Use chlorothalonil-based fungicide and remove affected leaves.";
            case "late_blight" -> "Apply copper-based fungicide and avoid overhead watering.";
            case "healthy" -> "No major disease detected. Monitor plant regularly.";
            case "septoria_leaf_spot" -> "Rotate crops and use fungicide with mancozeb.";
            default -> "Isolate the plant, remove infected leaves, and consult local expert if spreading.";
        };

        DetectionReport saved = repository.save(new DetectionReport(request.getCropType(), diseaseName, confidence, treatment));
        return ResponseEntity.ok(new DetectionResponse(saved.getId(), diseaseName, confidence, treatment));
    }
}
