package com.krishimitra.backend.notification;

import com.krishimitra.backend.detection.DetectionService;
import com.krishimitra.backend.detection.RiskAlertResponse;
import com.krishimitra.backend.market.MarketController;
import com.krishimitra.backend.market.MarketPriceAlert;
import com.krishimitra.backend.market.MarketPriceAlertRepository;
import com.krishimitra.backend.market.MarketResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Locale;

@Service
public class NotificationService {
    private static final String TYPE_RISK_ALERT = "RISK_ALERT";
    private static final String TYPE_MARKET_ALERT = "MARKET_ALERT";
    private static final String MARKET_ALERT_TRIGGERED_TITLE_KEY = "MARKET_ALERT_TRIGGERED";
    private static final String MARKET_ALERT_SOURCE_PREFIX = "MARKET_ALERT_";

    private final FarmerNotificationRepository notificationRepository;
    private final DetectionService detectionService;
    private final MarketPriceAlertRepository marketPriceAlertRepository;
    private final MarketController marketController;
    private final NotificationDeliveryService deliveryService;

    public NotificationService(FarmerNotificationRepository notificationRepository,
                               DetectionService detectionService,
                               MarketPriceAlertRepository marketPriceAlertRepository,
                               MarketController marketController,
                               NotificationDeliveryService deliveryService) {
        this.notificationRepository = notificationRepository;
        this.detectionService = detectionService;
        this.marketPriceAlertRepository = marketPriceAlertRepository;
        this.marketController = marketController;
        this.deliveryService = deliveryService;
    }

    @Transactional
    public List<FarmerNotificationResponse> getNotifications(String farmerEmail, int limit) {
        if (farmerEmail == null || farmerEmail.isBlank()) {
            return List.of();
        }

        syncRiskNotifications(farmerEmail);
        syncMarketNotifications(farmerEmail);
        migrateLegacyMarketNotifications(farmerEmail);
        int safeLimit = Math.max(1, Math.min(100, limit));
        return notificationRepository.findTop100ByFarmerEmailOrderByCreatedAtDesc(farmerEmail).stream()
                .limit(safeLimit)
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public long getUnreadCount(String farmerEmail) {
        if (farmerEmail == null || farmerEmail.isBlank()) {
            return 0;
        }

        syncRiskNotifications(farmerEmail);
        syncMarketNotifications(farmerEmail);
        migrateLegacyMarketNotifications(farmerEmail);
        return notificationRepository.countByFarmerEmailAndReadAtIsNull(farmerEmail);
    }

    @Transactional
    public FarmerNotificationResponse markAsRead(Long notificationId, String farmerEmail) {
        FarmerNotification notification = notificationRepository.findByIdAndFarmerEmail(notificationId, farmerEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));

        if (notification.getReadAt() == null) {
            notification.setReadAt(Instant.now());
            notification = notificationRepository.save(notification);
        }

        return toResponse(notification);
    }

    @Transactional
    public int markAllAsRead(String farmerEmail) {
        if (farmerEmail == null || farmerEmail.isBlank()) {
            return 0;
        }
        return notificationRepository.markAllAsRead(farmerEmail, Instant.now());
    }

    private void syncRiskNotifications(String farmerEmail) {
        List<RiskAlertResponse> riskAlerts = detectionService.getRiskAlerts(farmerEmail, 20);
        for (RiskAlertResponse alert : riskAlerts) {
            String sourceRef = "RISK_REPORT_" + alert.getReportId() + "_" + alert.getLevel();
            if (notificationRepository.existsByFarmerEmailAndTypeAndSourceRef(farmerEmail, TYPE_RISK_ALERT, sourceRef)) {
                continue;
            }

            FarmerNotification notification = new FarmerNotification(
                    farmerEmail,
                    TYPE_RISK_ALERT,
                    sourceRef,
                    alert.getReportId(),
                    alert.getLevel(),
                    alert.getTitle(),
                    alert.getMessage(),
                    alert.getCreatedAt() != null ? alert.getCreatedAt() : Instant.now()
            );
            FarmerNotification saved = notificationRepository.save(notification);
            deliveryService.dispatch(saved);
        }
    }

    private void syncMarketNotifications(String farmerEmail) {
        List<MarketPriceAlert> alerts = marketPriceAlertRepository.findTop50ByFarmerEmailOrderByCreatedAtDesc(farmerEmail);
        for (MarketPriceAlert alert : alerts) {
            MarketResponse market = marketController.getMarket(alert.getCropType(), alert.getCity());
            double currentPrice = market.getCurrentPrice();
            boolean triggered = isTriggered(alert, currentPrice);
            if (!triggered) {
                continue;
            }

            String sourceRef = MARKET_ALERT_SOURCE_PREFIX + alert.getId();
            if (notificationRepository.existsByFarmerEmailAndTypeAndSourceRef(farmerEmail, TYPE_MARKET_ALERT, sourceRef)) {
                continue;
            }

            String title = MARKET_ALERT_TRIGGERED_TITLE_KEY;
            String message = buildMarketPayload(alert, currentPrice);

            FarmerNotification notification = new FarmerNotification(
                    farmerEmail,
                    TYPE_MARKET_ALERT,
                    sourceRef,
                    alert.getId(),
                    "MEDIUM",
                    title,
                    message,
                    Instant.now()
            );
            FarmerNotification saved = notificationRepository.save(notification);
            deliveryService.dispatch(saved);
        }
    }

    private void migrateLegacyMarketNotifications(String farmerEmail) {
        List<FarmerNotification> notifications = notificationRepository.findTop100ByFarmerEmailOrderByCreatedAtDesc(farmerEmail);
        for (FarmerNotification notification : notifications) {
            if (!TYPE_MARKET_ALERT.equals(notification.getType())) {
                continue;
            }
            if (MARKET_ALERT_TRIGGERED_TITLE_KEY.equals(notification.getTitle())
                    && isStructuredMarketPayload(notification.getMessage())) {
                continue;
            }

            Long alertId = resolveMarketAlertId(notification);
            if (alertId == null) {
                continue;
            }

            MarketPriceAlert alert = marketPriceAlertRepository.findByIdAndFarmerEmail(alertId, farmerEmail).orElse(null);
            if (alert == null) {
                continue;
            }

            MarketResponse market = marketController.getMarket(alert.getCropType(), alert.getCity());
            double currentPrice = market.getCurrentPrice();
            if (!isTriggered(alert, currentPrice)) {
                continue;
            }

            notification.setTitle(MARKET_ALERT_TRIGGERED_TITLE_KEY);
            notification.setMessage(buildMarketPayload(alert, currentPrice));
            notification.setSourceReportId(alert.getId());
            notificationRepository.save(notification);
        }
    }

    private static Long resolveMarketAlertId(FarmerNotification notification) {
        if (notification.getSourceReportId() != null) {
            return notification.getSourceReportId();
        }
        String sourceRef = notification.getSourceRef();
        if (sourceRef == null || !sourceRef.startsWith(MARKET_ALERT_SOURCE_PREFIX)) {
            return null;
        }
        String rawId = sourceRef.substring(MARKET_ALERT_SOURCE_PREFIX.length());
        if (rawId.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(rawId);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private static boolean isStructuredMarketPayload(String message) {
        if (message == null || message.isBlank()) {
            return false;
        }
        String[] parts = message.split("\\|");
        if (parts.length != 5) {
            return false;
        }
        try {
            Double.parseDouble(parts[3]);
            Double.parseDouble(parts[4]);
            return true;
        } catch (NumberFormatException ignored) {
            return false;
        }
    }

    private static String buildMarketPayload(MarketPriceAlert alert, double currentPrice) {
        return String.format(
                Locale.ROOT,
                "%s|%s|%s|%.2f|%.2f",
                alert.getCropType(),
                alert.getCity(),
                alert.getDirection(),
                currentPrice,
                alert.getTargetPrice()
        );
    }

    private static boolean isTriggered(MarketPriceAlert alert, double currentPrice) {
        if ("BELOW".equalsIgnoreCase(alert.getDirection())) {
            return currentPrice <= alert.getTargetPrice();
        }
        return currentPrice >= alert.getTargetPrice();
    }

    private FarmerNotificationResponse toResponse(FarmerNotification notification) {
        return new FarmerNotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getLevel(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getSourceReportId(),
                notification.getCreatedAt(),
                notification.isRead()
        );
    }
}