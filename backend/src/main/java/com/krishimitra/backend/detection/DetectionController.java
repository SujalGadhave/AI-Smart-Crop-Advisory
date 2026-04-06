package com.krishimitra.backend.detection;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
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

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> aiResponse = restTemplate.postForObject(aiServiceUrl, payload, Map.class);

            if (aiResponse != null) {
                // Check for plant validation failure returned by AI service
                Object errorFlag = aiResponse.get("error");
                if (Boolean.TRUE.equals(errorFlag)) {
                    String errorCode = (String) aiResponse.getOrDefault("error_code", "UNKNOWN_ERROR");
                    String message = (String) aiResponse.getOrDefault("message",
                            "Image does not appear to be a crop leaf. Please upload a plant image.");
                    return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                            .body(new DetectionResponse(true, errorCode, message));
                }

                // Extract disease prediction fields
                String diseaseName = (String) aiResponse.getOrDefault("disease", "unknown");
                double confidence = 0.0;
                Object conf = aiResponse.get("confidence");
                if (conf instanceof Number) {
                    confidence = ((Number) conf).doubleValue();
                }

                String severity = (String) aiResponse.getOrDefault("severity", "low");
                double affectedAreaPercent = 0.0;
                Object area = aiResponse.get("affected_area_percent");
                if (area instanceof Number) {
                    affectedAreaPercent = ((Number) area).doubleValue();
                }

                @SuppressWarnings("unchecked")
                List<String> symptoms = (List<String>) aiResponse.getOrDefault("symptoms", List.of());

                boolean isHealthy = Boolean.TRUE.equals(aiResponse.get("is_healthy"));

                String treatment = resolveTreatment(diseaseName);

                DetectionReport saved = repository.save(
                        new DetectionReport(request.getCropType(), diseaseName, confidence,
                                treatment, severity, affectedAreaPercent));

                return ResponseEntity.ok(new DetectionResponse(saved.getId(), request.getCropType(),
                        diseaseName, confidence, treatment, severity, affectedAreaPercent, symptoms, isHealthy));
            }
        } catch (Exception e) {
            log.warn("AI service not reachable: {}", e.getMessage());
        }

        // AI service unavailable – save a fallback report
        String fallbackDisease = "unknown";
        String fallbackTreatment = resolveTreatment(fallbackDisease);
        DetectionReport saved = repository.save(
                new DetectionReport(request.getCropType(), fallbackDisease, 0.0,
                        fallbackTreatment, "low", 0.0));
        return ResponseEntity.ok(new DetectionResponse(saved.getId(), request.getCropType(),
                fallbackDisease, 0.0, fallbackTreatment, "low", 0.0, List.of(), false));
    }

    private static String resolveTreatment(String diseaseName) {
        return switch (diseaseName.toLowerCase()) {
            case "tomato_early_blight", "potato_early_blight" ->
                    "Apply chlorothalonil-based fungicide every 7 days. Remove and destroy infected leaves. Ensure good air circulation.";
            case "tomato_late_blight", "potato_late_blight" ->
                    "Apply copper-based fungicide immediately. Avoid overhead watering. Remove and destroy infected plant material.";
            case "tomato_septoria_leaf_spot" ->
                    "Remove infected leaves. Apply mancozeb fungicide. Practice crop rotation and avoid wetting foliage.";
            case "tomato_leaf_mold" ->
                    "Improve ventilation. Reduce humidity. Apply fungicide containing chlorothalonil or mancozeb.";
            case "corn_northern_leaf_blight" ->
                    "Apply foliar fungicide at early disease onset. Use resistant varieties for future planting. Remove crop debris after harvest.";
            case "corn_common_rust" ->
                    "Apply triazole or strobilurin fungicide if severe. Use resistant hybrids. Monitor regularly during humid conditions.";
            case "healthy" ->
                    "No disease detected. Monitor plant regularly and maintain good agricultural practices.";
            default ->
                    "Isolate the plant, remove infected leaves, and consult a local agricultural expert if symptoms spread.";
        };
    }
}
