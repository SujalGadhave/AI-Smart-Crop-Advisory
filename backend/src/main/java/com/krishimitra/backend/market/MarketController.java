package com.krishimitra.backend.market;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@RestController
@RequestMapping("/api/market")
@CrossOrigin(origins = "*")
public class MarketController {

        private static final Logger log = LoggerFactory.getLogger(MarketController.class);
        private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

        private final RestTemplate restTemplate;
        private final MarketPriceAlertRepository alertRepository;

        @Value("${market.api.base-url:https://vegetablemarketprice.com}")
        private String marketApiBaseUrl;

        public MarketController(RestTemplate restTemplate,
                                MarketPriceAlertRepository alertRepository) {
                this.restTemplate = restTemplate;
                this.alertRepository = alertRepository;
        }

    private final Map<String, MarketResponse> seeds = Map.of(
            "tomato", new MarketResponse("tomato", "pune", 2200, List.of(
                    new MarketPoint("2024-03-01", 2100),
                    new MarketPoint("2024-03-08", 2150),
                    new MarketPoint("2024-03-15", 2200),
                    new MarketPoint("2024-03-22", 2250)
            )),
            "potato", new MarketResponse("potato", "nashik", 1800, List.of(
                    new MarketPoint("2024-03-01", 1700),
                    new MarketPoint("2024-03-08", 1720),
                    new MarketPoint("2024-03-15", 1780),
                    new MarketPoint("2024-03-22", 1800)
            )),
            "corn", new MarketResponse("corn", "nagpur", 1400, List.of(
                    new MarketPoint("2024-03-01", 1300),
                    new MarketPoint("2024-03-08", 1350),
                    new MarketPoint("2024-03-15", 1380),
                    new MarketPoint("2024-03-22", 1400)
            ))
    );

    @GetMapping
        public MarketResponse getMarket(@RequestParam("cropType") String cropType,
                                                                        @RequestParam(value = "city", required = false, defaultValue = "pune") String city) {
                String normalizedCrop = normalizeCrop(cropType);
                String vegId = mapCropToVegetableId(normalizedCrop);
                String marketSlug = normalizeMarket(city);

                try {
                        LivePriceData livePriceData = fetchLivePriceAndTrend(marketSlug, vegId);
                        if (livePriceData != null && livePriceData.currentPrice > 0 && !livePriceData.trend.isEmpty()) {
                                return new MarketResponse(normalizedCrop, marketSlug, livePriceData.currentPrice, livePriceData.trend);
                        }
                } catch (Exception e) {
                        log.warn("Failed to fetch live market price for crop={} city={}. Using fallback data.", normalizedCrop, marketSlug, e);
                }

                if (!"pune".equals(marketSlug)) {
                        try {
                                LivePriceData puneLivePrice = fetchLivePriceAndTrend("pune", vegId);
                                if (puneLivePrice != null && puneLivePrice.currentPrice > 0 && !puneLivePrice.trend.isEmpty()) {
                                        return new MarketResponse(normalizedCrop, "pune", puneLivePrice.currentPrice, puneLivePrice.trend);
                                }
                        } catch (Exception e) {
                                log.warn("Failed to fetch Pune fallback market data for crop={}. Using seeded values.", normalizedCrop, e);
                        }
                }

                return seeds.getOrDefault(normalizedCrop, seeds.get("tomato"));
        }

        @PostMapping("/alerts")
        public MarketAlertResponse createAlert(@RequestBody MarketAlertRequest request,
                                               Authentication authentication) {
                String farmerEmail = authentication != null ? authentication.getName() : null;
                if (farmerEmail == null || farmerEmail.isBlank()) {
                        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
                }

                if (request.getTargetPrice() == null || request.getTargetPrice() <= 0) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "targetPrice must be greater than 0");
                }

                String normalizedCrop = normalizeCrop(request.getCropType());
                String normalizedCity = normalizeMarket(request.getCity());
                String normalizedDirection = normalizeDirection(request.getDirection());

                MarketPriceAlert created = alertRepository.save(new MarketPriceAlert(
                        farmerEmail,
                        normalizedCrop,
                        normalizedCity,
                        request.getTargetPrice(),
                        normalizedDirection
                ));

                return toAlertResponse(created);
        }

        @GetMapping("/alerts")
        public List<MarketAlertResponse> getAlerts(Authentication authentication,
                                                   @RequestParam(value = "limit", defaultValue = "20") int limit) {
                String farmerEmail = authentication != null ? authentication.getName() : null;
                if (farmerEmail == null || farmerEmail.isBlank()) {
                        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
                }

                int safeLimit = Math.max(1, Math.min(50, limit));
                return alertRepository.findTop50ByFarmerEmailOrderByCreatedAtDesc(farmerEmail).stream()
                        .limit(safeLimit)
                        .map(this::toAlertResponse)
                        .toList();
        }

        @DeleteMapping("/alerts/{alertId}")
        public void deleteAlert(@PathVariable Long alertId,
                                Authentication authentication) {
                String farmerEmail = authentication != null ? authentication.getName() : null;
                if (farmerEmail == null || farmerEmail.isBlank()) {
                        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
                }

                MarketPriceAlert alert = alertRepository.findByIdAndFarmerEmail(alertId, farmerEmail)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Alert not found"));
                alertRepository.delete(alert);
        }

        private LivePriceData fetchLivePriceAndTrend(String marketSlug, String vegId) {
                String today = LocalDate.now(ZoneId.of("Asia/Kolkata")).format(DATE_FORMATTER);
                String baseUrl = (marketApiBaseUrl == null || marketApiBaseUrl.isBlank())
                                ? "https://vegetablemarketprice.com"
                                : marketApiBaseUrl;
                String safeBaseUrl = Objects.requireNonNull(baseUrl);

                String dayWiseUrl = UriComponentsBuilder
                                .fromHttpUrl(safeBaseUrl)
                                .pathSegment("api", "dataapi", "market", marketSlug, "daywisedata")
                                .queryParam("date", today)
                                .build(true)
                                .toUriString();

                String trendUrl = UriComponentsBuilder
                                .fromHttpUrl(safeBaseUrl)
                                .pathSegment("api", "dataapi", "market", marketSlug, "latestchartdata")
                                .queryParam("days", 7)
                                .queryParam("vegIds", vegId)
                                .build(true)
                                .toUriString();

                @SuppressWarnings("unchecked")
                Map<String, Object> dayWiseResponse = restTemplate.getForObject(dayWiseUrl, Map.class);
                @SuppressWarnings("unchecked")
                Map<String, Object> trendResponse = restTemplate.getForObject(trendUrl, Map.class);

                double currentPrice = extractCurrentPrice(dayWiseResponse, vegId);
                List<MarketPoint> trend = extractTrend(trendResponse);
                return new LivePriceData(currentPrice, trend);
        }

        private double extractCurrentPrice(Map<String, Object> dayWiseResponse, String vegId) {
                if (dayWiseResponse == null) {
                        return 0;
                }
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> rows = (List<Map<String, Object>>) dayWiseResponse.get("data");
                if (rows == null || rows.isEmpty()) {
                        return 0;
                }

                Optional<Map<String, Object>> selected = rows.stream()
                                .filter(Objects::nonNull)
                                .filter(row -> vegId.equalsIgnoreCase(String.valueOf(row.getOrDefault("id", ""))))
                                .findFirst();

                return selected
                                .map(row -> row.get("price"))
                                .filter(Number.class::isInstance)
                                .map(Number.class::cast)
                                .map(Number::doubleValue)
                                .orElse(0.0);
        }

        private List<MarketPoint> extractTrend(Map<String, Object> trendResponse) {
                if (trendResponse == null) {
                        return List.of();
                }
                @SuppressWarnings("unchecked")
                List<String> columns = (List<String>) trendResponse.get("columns");
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> seriesList = (List<Map<String, Object>>) trendResponse.get("data");

                if (columns == null || columns.isEmpty() || seriesList == null || seriesList.isEmpty()) {
                        return List.of();
                }

                @SuppressWarnings("unchecked")
                List<Map<String, Object>> points = (List<Map<String, Object>>) seriesList.get(0).get("data");
                if (points == null || points.isEmpty()) {
                        return List.of();
                }

                int size = Math.min(columns.size(), points.size());
                List<MarketPoint> trend = new ArrayList<>();
                for (int i = 0; i < size; i++) {
                        Object yVal = points.get(i).get("y");
                        if (yVal instanceof Number price) {
                                trend.add(new MarketPoint(columns.get(i), price.doubleValue()));
                        }
                }

                trend.sort(Comparator.comparing(MarketPoint::getDate));
                return trend;
        }

        private String normalizeCrop(String cropType) {
                if (cropType == null || cropType.isBlank()) {
                        return "tomato";
                }
                return cropType.trim().toLowerCase(Locale.ROOT);
        }

        private String mapCropToVegetableId(String cropType) {
                return switch (cropType) {
                        case "potato" -> "potato";
                        case "corn" -> "corn";
                        default -> "tomato";
                };
        }

        private String normalizeMarket(String city) {
                if (city == null || city.isBlank()) {
                        return "pune";
                }
                return city.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
        }

        private String normalizeDirection(String direction) {
                if (direction == null || direction.isBlank()) {
                        return "ABOVE";
                }
                String normalized = direction.trim().toUpperCase(Locale.ROOT);
                return switch (normalized) {
                        case "ABOVE", "BELOW" -> normalized;
                        default -> "ABOVE";
                };
        }

        private MarketAlertResponse toAlertResponse(MarketPriceAlert alert) {
                MarketResponse market = getMarket(alert.getCropType(), alert.getCity());
                double currentPrice = market.getCurrentPrice();
                boolean triggered = "ABOVE".equalsIgnoreCase(alert.getDirection())
                        ? currentPrice >= alert.getTargetPrice()
                        : currentPrice <= alert.getTargetPrice();

                String message = triggered
                        ? String.format("Price %.0f reached target %.0f (%s)", currentPrice, alert.getTargetPrice(), alert.getDirection())
                        : String.format("Current %.0f, waiting for %.0f (%s)", currentPrice, alert.getTargetPrice(), alert.getDirection());

                return new MarketAlertResponse(
                        alert.getId(),
                        alert.getCropType(),
                        alert.getCity(),
                        alert.getTargetPrice(),
                        alert.getDirection(),
                        currentPrice,
                        triggered,
                        message,
                        alert.getCreatedAt()
                );
        }

        private static class LivePriceData {
                private final double currentPrice;
                private final List<MarketPoint> trend;

                private LivePriceData(double currentPrice, List<MarketPoint> trend) {
                        this.currentPrice = currentPrice;
                        this.trend = trend;
                }
    }
}
