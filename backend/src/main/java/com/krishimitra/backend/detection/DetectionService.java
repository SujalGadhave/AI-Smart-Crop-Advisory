package com.krishimitra.backend.detection;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DetectionService {

    private final RestTemplate restTemplate;
    private final DetectionReportRepository repository;

    @Value("${ai.service.url:http://localhost:8000/predict}")
    private String aiServiceUrl;

    public DetectionService(RestTemplate restTemplate, DetectionReportRepository repository) {
        this.restTemplate = restTemplate;
        this.repository = repository;
    }

    @Transactional
    public DetectionResponse detect(DetectionRequest request) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("crop_type", request.getCropType());
        payload.put("image_base64", request.getImageBase64());

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> aiResponse = restTemplate.postForObject(aiServiceUrl, payload, Map.class);

            if (aiResponse != null) {
                Object errorFlag = aiResponse.get("error");
                if (Boolean.TRUE.equals(errorFlag)) {
                    String errorCode = (String) aiResponse.getOrDefault("error_code", "UNKNOWN_ERROR");
                    String message = (String) aiResponse.getOrDefault(
                            "message",
                            "Image does not appear to be a crop leaf. Please upload a plant image."
                    );
                    return new DetectionResponse(true, errorCode, message);
                }

                String diseaseName = (String) aiResponse.getOrDefault("disease", "unknown");
                double confidence = getDouble(aiResponse.get("confidence"));
                String severity = (String) aiResponse.getOrDefault("severity", "low");
                double affectedAreaPercent = getDouble(aiResponse.get("affected_area_percent"));

                @SuppressWarnings("unchecked")
                List<String> symptoms = (List<String>) aiResponse.getOrDefault("symptoms", List.of());

                boolean isHealthy = Boolean.TRUE.equals(aiResponse.get("is_healthy"));
                String treatment = resolveTreatment(diseaseName);

                DetectionReport saved = repository.save(new DetectionReport(
                        request.getCropType(),
                        diseaseName,
                        confidence,
                        treatment,
                        severity,
                        affectedAreaPercent
                ));

                return new DetectionResponse(
                        saved.getId(),
                        request.getCropType(),
                        diseaseName,
                        confidence,
                        treatment,
                        severity,
                        affectedAreaPercent,
                        symptoms,
                        isHealthy
                );
            }
        } catch (Exception ignored) {
            // Keep fallback flow to preserve system availability if AI service is down.
        }

        String fallbackDisease = "unknown";
        String fallbackTreatment = resolveTreatment(fallbackDisease);
        DetectionReport saved = repository.save(new DetectionReport(
                request.getCropType(),
                fallbackDisease,
                0.0,
                fallbackTreatment,
                "low",
                0.0
        ));

        return new DetectionResponse(
                saved.getId(),
                request.getCropType(),
                fallbackDisease,
                0.0,
                fallbackTreatment,
                "low",
                0.0,
                List.of(),
                false
        );
    }

    @Transactional(readOnly = true)
    public List<DetectionResponse> getRecentReports(int limit) {
        return repository.findTop50ByOrderByCreatedAtDesc().stream()
                .limit(limit)
                .map(report -> new DetectionResponse(
                        report.getId(),
                        report.getCropType(),
                        report.getDiseaseName(),
                        report.getConfidence(),
                        report.getTreatment(),
                        report.getSeverity(),
                        report.getAffectedAreaPercent(),
                        List.of(),
                        "healthy".equalsIgnoreCase(report.getDiseaseName())
                ))
                .toList();
    }

    public static String resolveTreatment(String diseaseName) {
        return switch (diseaseName.toLowerCase()) {
            case "tomato_early_blight", "potato_early_blight" ->
                    "Spray chlorothalonil every 7 days, prune infected leaves, and avoid leaf wetness late in the day.";
            case "tomato_late_blight", "potato_late_blight" ->
                    "Apply copper fungicide immediately, improve drainage, and remove infected plants to stop spread.";
            case "tomato_septoria_leaf_spot" ->
                    "Remove infected lower leaves, use mancozeb spray, and rotate crops away from tomato for one season.";
            case "tomato_leaf_mold" ->
                    "Reduce humidity with wider spacing and airflow, and apply a preventive fungicide if humidity remains high.";
            case "corn_northern_leaf_blight" ->
                    "Spray foliar fungicide at early lesion stage and use resistant seed in the next cycle.";
            case "corn_common_rust" ->
                    "Use recommended triazole fungicide when pustules spread rapidly and monitor field every 3-4 days.";
            case "healthy" ->
                    "No disease detected. Maintain balanced nutrition, regular scouting, and clean irrigation practices.";
            default ->
                    "Isolate affected plants, remove severely damaged leaves, and consult the nearest agriculture extension officer.";
        };
    }

    public static List<String> getDiseaseCareChecklist(String diseaseName) {
        return switch (diseaseName.toLowerCase()) {
            case "tomato_early_blight", "potato_early_blight" -> List.of(
                    "Start fungicide rotation early; do not wait for full canopy infection.",
                    "Avoid overhead irrigation in evening hours.",
                    "Destroy crop residue after harvest to reduce carry-over spores."
            );
            case "tomato_late_blight", "potato_late_blight" -> List.of(
                    "Rogue infected leaves and plants immediately.",
                    "Use preventive copper spray before forecasted rain periods.",
                    "Do not move tools from infected to healthy plots without cleaning."
            );
            case "tomato_septoria_leaf_spot" -> List.of(
                    "Remove bottom leaves touching soil.",
                    "Maintain spacing for airflow.",
                    "Follow 7-10 day fungicide schedule during humid weeks."
            );
            case "tomato_leaf_mold" -> List.of(
                    "Ventilate protected cultivation areas.",
                    "Keep relative humidity under control.",
                    "Use resistant varieties in next planting."
            );
            case "corn_northern_leaf_blight" -> List.of(
                    "Scout lower leaves from vegetative stage onward.",
                    "Apply fungicide before lesions merge.",
                    "Use residue management to reduce inoculum."
            );
            case "corn_common_rust" -> List.of(
                    "Track disease pressure after humid weather.",
                    "Protect upper canopy during tasseling stage.",
                    "Prioritize resistant hybrids in disease-prone fields."
            );
            case "healthy" -> List.of(
                    "Continue weekly scouting.",
                    "Maintain balanced NPK and micronutrients.",
                    "Use clean irrigation water and weed control."
            );
            default -> List.of(
                    "Capture clear photos of affected leaves for extension support.",
                    "Segregate infected plants where feasible.",
                    "Use only label-approved agrochemicals."
            );
        };
    }

    private static double getDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        return 0.0;
    }
}
