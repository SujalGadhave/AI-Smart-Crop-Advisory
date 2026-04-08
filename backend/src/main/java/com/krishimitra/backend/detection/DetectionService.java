package com.krishimitra.backend.detection;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

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
                return detect(request, null);
        }

    @Transactional
        public DetectionResponse detect(DetectionRequest request, String farmerEmail) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("crop_type", request.getCropType());
        payload.put("image_base64", request.getImageBase64());
                String serviceUrl = (aiServiceUrl == null || aiServiceUrl.isBlank())
                                ? "http://localhost:8000/predict"
                                : aiServiceUrl;
                String safeServiceUrl = Objects.requireNonNull(serviceUrl);

        try {
            @SuppressWarnings("unchecked")
                        Map<String, Object> aiResponse = restTemplate.postForObject(safeServiceUrl, payload, Map.class);

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
                        affectedAreaPercent,
                        farmerEmail
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
                0.0,
                farmerEmail
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

        @Transactional(readOnly = true)
        public List<RiskAlertResponse> getRiskAlerts(String farmerEmail, int limit) {
                if (farmerEmail == null || farmerEmail.isBlank()) {
                        return List.of();
                }

                return repository.findTop50ByFarmerEmailOrderByCreatedAtDesc(farmerEmail).stream()
                                .map(this::toRiskAlert)
                                .flatMap(java.util.Optional::stream)
                                .limit(limit)
                                .toList();
        }

        @Transactional(readOnly = true)
        public List<TimelineItemResponse> getTimeline(String farmerEmail, int limit) {
                if (farmerEmail == null || farmerEmail.isBlank()) {
                        return List.of();
                }

                return repository.findTop50ByFarmerEmailOrderByCreatedAtDesc(farmerEmail).stream()
                                .limit(limit)
                                .map(this::toTimelineItem)
                                .toList();
        }

        @Transactional
        public TimelineItemResponse updateFollowUp(Long reportId, String farmerEmail, FollowUpUpdateRequest request) {
                DetectionReport report = repository.findById(reportId)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found"));

                if (farmerEmail == null || farmerEmail.isBlank() || !farmerEmail.equalsIgnoreCase(report.getFarmerEmail())) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed to update this report");
                }

                String normalizedStatus = normalizeStatus(request.getStatus());
                report.setFollowUpStatus(normalizedStatus);
                report.setFollowUpNotes(trimToNull(request.getNotes()));
                report.setFollowUpUpdatedAt(Instant.now());

                DetectionReport saved = repository.save(report);
                return toTimelineItem(saved);
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

        private TimelineItemResponse toTimelineItem(DetectionReport report) {
                List<Instant> reminderSchedule = List.of(
                                report.getCreatedAt().plusSeconds(3L * 24L * 60L * 60L),
                                report.getCreatedAt().plusSeconds(7L * 24L * 60L * 60L),
                                report.getCreatedAt().plusSeconds(14L * 24L * 60L * 60L)
                );

                Instant nextFollowUpAt = reminderSchedule.stream()
                                .filter(date -> date.isAfter(Instant.now()))
                                .findFirst()
                                .orElse(null);

                return new TimelineItemResponse(
                                report.getId(),
                                report.getCropType(),
                                report.getDiseaseName(),
                                report.getConfidence(),
                                report.getTreatment(),
                                report.getSeverity(),
                                report.getAffectedAreaPercent(),
                                report.getCreatedAt(),
                                normalizeStatus(report.getFollowUpStatus()),
                                report.getFollowUpNotes(),
                                report.getFollowUpUpdatedAt(),
                                nextFollowUpAt,
                                reminderSchedule
                );
        }

        private static String normalizeStatus(String status) {
                if (status == null || status.isBlank()) {
                        return "PENDING";
                }

                String normalized = status.trim().toUpperCase();
                return switch (normalized) {
                        case "PENDING", "IN_PROGRESS", "COMPLETED", "NEEDS_ATTENTION" -> normalized;
                        default -> "PENDING";
                };
        }

        private static String trimToNull(String value) {
                if (value == null) {
                        return null;
                }
                String trimmed = value.trim();
                return trimmed.isEmpty() ? null : trimmed;
        }

    private java.util.Optional<RiskAlertResponse> toRiskAlert(DetectionReport report) {
        String followUpStatus = normalizeStatus(report.getFollowUpStatus());
        String diseaseLabel = (report.getDiseaseName() == null || report.getDiseaseName().isBlank())
                ? "Unknown"
                : report.getDiseaseName().replace('_', ' ');
        Instant firstFollowUpDueAt = report.getCreatedAt().plusSeconds(3L * 24L * 60L * 60L);
        Instant extendedDueAt = report.getCreatedAt().plusSeconds(7L * 24L * 60L * 60L);
        boolean firstFollowUpOverdue = Instant.now().isAfter(firstFollowUpDueAt);

        if ("COMPLETED".equals(followUpStatus)) {
            return java.util.Optional.empty();
        }

        if ("NEEDS_ATTENTION".equals(followUpStatus)) {
            return java.util.Optional.of(new RiskAlertResponse(
                    report.getId(),
                    "HIGH",
                    "Immediate agronomy follow-up needed",
                    "This case was marked as NEEDS_ATTENTION. Revisit field and action treatment plan today.",
                    diseaseLabel,
                    report.getCreatedAt(),
                    firstFollowUpDueAt
            ));
        }

        if ("high".equalsIgnoreCase(report.getSeverity()) && !"COMPLETED".equals(followUpStatus)) {
            return java.util.Optional.of(new RiskAlertResponse(
                    report.getId(),
                    "HIGH",
                    "High severity case pending follow-up",
                    "High severity detection still needs follow-up. Prioritize treatment and monitor crop spread.",
                    diseaseLabel,
                    report.getCreatedAt(),
                    firstFollowUpDueAt
            ));
        }

        if ("PENDING".equals(followUpStatus) && firstFollowUpOverdue) {
            return java.util.Optional.of(new RiskAlertResponse(
                    report.getId(),
                    "MEDIUM",
                    "Follow-up is overdue",
                    "No follow-up update yet. Capture a fresh field check and treatment progress update.",
                    diseaseLabel,
                    report.getCreatedAt(),
                    firstFollowUpDueAt
            ));
        }

        if ("IN_PROGRESS".equals(followUpStatus) && Instant.now().isAfter(extendedDueAt)) {
            return java.util.Optional.of(new RiskAlertResponse(
                    report.getId(),
                    "MEDIUM",
                    "Treatment in progress for over 7 days",
                    "Review treatment effectiveness and decide whether escalation is required.",
                    diseaseLabel,
                    report.getCreatedAt(),
                    extendedDueAt
            ));
        }

        return java.util.Optional.empty();
    }
}
