package com.krishimitra.backend.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class NotificationDeliveryService {
    private static final Logger log = LoggerFactory.getLogger(NotificationDeliveryService.class);
    private static final String STATUS_DELIVERED = "DELIVERED";
    private static final String STATUS_SKIPPED = "SKIPPED";
    private static final String STATUS_FAILED = "FAILED";

    private final NotificationDeliveryAttemptRepository attemptRepository;
    private final FarmerNotificationRepository notificationRepository;
    private final NotificationChannelPreferenceService preferenceService;
    private final NotificationChannelDispatcher channelDispatcher;
    private final NotificationProviderProperties providerProperties;

    public NotificationDeliveryService(NotificationDeliveryAttemptRepository attemptRepository,
                                       FarmerNotificationRepository notificationRepository,
                                       NotificationChannelPreferenceService preferenceService,
                                       NotificationChannelDispatcher channelDispatcher,
                                       NotificationProviderProperties providerProperties) {
        this.attemptRepository = attemptRepository;
        this.notificationRepository = notificationRepository;
        this.preferenceService = preferenceService;
        this.channelDispatcher = channelDispatcher;
        this.providerProperties = providerProperties;
    }

    @Transactional
    public void dispatch(FarmerNotification notification) {
        NotificationChannelPreference preference = preferenceService.getOrCreate(notification.getFarmerEmail());

        saveAttempt(notification, "IN_APP", preference.isInAppEnabled(), "in-app", null);
        saveAttempt(notification, "SMS", preference.isSmsEnabled(), preference.getSmsNumber(), null);
        saveAttempt(notification, "WHATSAPP", preference.isWhatsappEnabled(), preference.getWhatsappNumber(), null);
        saveAttempt(notification, "PUSH", preference.isPushEnabled(), preference.getPushToken(), null);
    }

    @Transactional(readOnly = true)
    public List<NotificationDeliveryAttemptResponse> getDeliveryHistory(String farmerEmail, int limit) {
        int safeLimit = Math.max(1, Math.min(100, limit));
        return attemptRepository.findTop100ByFarmerEmailOrderByAttemptedAtDesc(farmerEmail).stream()
                .limit(safeLimit)
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<NotificationProviderPolicyResponse> getProviderPolicySnapshot() {
        return List.of(
                toPolicyResponse("SMS", providerProperties.getSms()),
                toPolicyResponse("WHATSAPP", providerProperties.getWhatsapp()),
                toPolicyResponse("PUSH", providerProperties.getPush())
        );
    }

        @Transactional(readOnly = true)
        public NotificationDiagnosticsResponse getDiagnostics(String farmerEmail, int windowDays) {
        int safeWindowDays = Math.max(1, Math.min(30, windowDays));
        Instant windowStart = Instant.now().minusSeconds((long) safeWindowDays * 24 * 60 * 60);

        List<NotificationDeliveryAttempt> attempts = attemptRepository
            .findByFarmerEmailAndAttemptedAtAfterOrderByAttemptedAtDesc(farmerEmail, windowStart);

        List<NotificationChannelDiagnosticsResponse> channelDiagnostics = buildChannelDiagnostics(attempts, safeWindowDays);

        List<NotificationDeliveryAttempt> retryAttempts = attempts.stream()
            .filter(NotificationDeliveryAttempt::isRetryAttempt)
            .toList();
        int totalRetries = retryAttempts.size();
        int deliveredRetries = countByStatus(retryAttempts, STATUS_DELIVERED);
        int failedRetries = countByStatus(retryAttempts, STATUS_FAILED);
        int skippedRetries = countByStatus(retryAttempts, STATUS_SKIPPED);
        double successRatePercent = totalRetries == 0 ? 0.0 : (deliveredRetries * 100.0) / totalRetries;

        NotificationRetryOutcomeDiagnosticsResponse retryOutcomes = new NotificationRetryOutcomeDiagnosticsResponse(
            totalRetries,
            deliveredRetries,
            failedRetries,
            skippedRetries,
            roundTwoDecimals(successRatePercent)
        );

        return new NotificationDiagnosticsResponse(
            Instant.now(),
            safeWindowDays,
            retryOutcomes,
            channelDiagnostics
        );
        }

    @Transactional
    public NotificationDeliveryAttemptResponse retryAttempt(Long attemptId, String farmerEmail) {
        NotificationDeliveryAttempt sourceAttempt = attemptRepository.findByIdAndFarmerEmail(attemptId, farmerEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery attempt not found"));

        if (!STATUS_FAILED.equals(sourceAttempt.getStatus()) && !STATUS_SKIPPED.equals(sourceAttempt.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only FAILED or SKIPPED attempts can be retried");
        }

        FarmerNotification notification = notificationRepository
                .findByIdAndFarmerEmail(sourceAttempt.getNotificationId(), farmerEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found for retry"));

        NotificationDeliveryAttempt retried = saveRetryAttempt(notification, sourceAttempt.getChannel(), sourceAttempt.getDestination());
        return toResponse(retried);
    }

    @Transactional
    public NotificationDeliveryAttemptResponse processProviderCallback(String channel,
                                                                       String callbackToken,
                                                                       NotificationProviderCallbackRequest request) {
        String normalizedChannel = normalizeExternalChannel(channel);
        if (normalizedChannel == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported channel");
        }
        if (request == null || request.getProviderRef() == null || request.getProviderRef().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "providerRef is required");
        }

        NotificationProviderProperties.Channel channelConfig = channelConfig(normalizedChannel);
        String expectedCallbackToken = trimToNull(channelConfig != null ? channelConfig.getCallbackToken() : null);
        if (expectedCallbackToken == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Callback token is not configured for channel");
        }

        String providedCallbackToken = trimToNull(callbackToken);
        if (providedCallbackToken == null || !expectedCallbackToken.equals(providedCallbackToken)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid provider callback token");
        }

        String providerRef = request.getProviderRef().trim();
        NotificationDeliveryAttempt attempt = attemptRepository
                .findTopByChannelAndProviderRefOrderByAttemptedAtDesc(normalizedChannel, providerRef)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery attempt not found for providerRef"));

        String normalizedStatus = normalizeCallbackStatus(request.getStatus());
        if (normalizedStatus != null) {
            attempt.setStatus(normalizedStatus);
        }

        if (request.getProviderStatusCode() != null) {
            attempt.setProviderStatusCode(request.getProviderStatusCode());
        }
        attempt.setProviderMessage(trimToNull(request.getProviderMessage()));
        attempt.setErrorMessage(trimToNull(request.getErrorMessage()));

        NotificationDeliveryAttempt saved = attemptRepository.save(attempt);
        return toResponse(saved);
    }

    private void saveAttempt(FarmerNotification notification,
                             String channel,
                             boolean enabled,
                             String destination,
                             String providerRef) {
        if (!enabled) {
            attemptRepository.save(new NotificationDeliveryAttempt(
                    notification.getFarmerEmail(),
                    notification.getId(),
                    channel,
                    STATUS_SKIPPED,
                    destination,
                    null,
                    "Channel disabled"
            ));
            return;
        }

        if (("SMS".equals(channel) || "WHATSAPP".equals(channel) || "PUSH".equals(channel))
                && (destination == null || destination.isBlank())) {
            attemptRepository.save(new NotificationDeliveryAttempt(
                    notification.getFarmerEmail(),
                    notification.getId(),
                    channel,
                    STATUS_SKIPPED,
                    destination,
                    null,
                    "Missing destination"
            ));
            return;
        }

        DeliveryProviderResult result = dispatchWithRetry(channel, destination, notification);

        if (!result.isSuccess()) {
                attemptRepository.save(new NotificationDeliveryAttempt(
                    notification.getFarmerEmail(),
                    notification.getId(),
                    channel,
                    STATUS_FAILED,
                    destination,
                    null,
                    result.getProviderStatusCode(),
                    result.getProviderMessage(),
                    result.getErrorMessage() != null ? result.getErrorMessage() : "Delivery failed"
            ));
            return;
        }

        attemptRepository.save(new NotificationDeliveryAttempt(
                notification.getFarmerEmail(),
                notification.getId(),
                channel,
                STATUS_DELIVERED,
                destination,
                result.getProviderRef(),
                result.getProviderStatusCode(),
                result.getProviderMessage(),
                null
        ));
    }

    private NotificationDeliveryAttempt saveRetryAttempt(FarmerNotification notification,
                                                         String channel,
                                                         String destination) {
        if (isExternalChannel(channel) && (destination == null || destination.isBlank())) {
            return attemptRepository.save(new NotificationDeliveryAttempt(
                    notification.getFarmerEmail(),
                    notification.getId(),
                    channel,
                    STATUS_SKIPPED,
                    destination,
                    null,
                    null,
                    null,
                    "Missing destination",
                    true
            ));
        }

        DeliveryProviderResult result = dispatchWithRetry(channel, destination, notification);

        if (!result.isSuccess()) {
            return attemptRepository.save(new NotificationDeliveryAttempt(
                    notification.getFarmerEmail(),
                    notification.getId(),
                    channel,
                    STATUS_FAILED,
                    destination,
                    null,
                    result.getProviderStatusCode(),
                    result.getProviderMessage(),
                    result.getErrorMessage() != null ? result.getErrorMessage() : "Delivery failed",
                    true
            ));
        }

        return attemptRepository.save(new NotificationDeliveryAttempt(
                notification.getFarmerEmail(),
                notification.getId(),
                channel,
                STATUS_DELIVERED,
                destination,
                result.getProviderRef(),
                result.getProviderStatusCode(),
                result.getProviderMessage(),
                null,
                true
        ));
    }

            private List<NotificationChannelDiagnosticsResponse> buildChannelDiagnostics(List<NotificationDeliveryAttempt> attempts,
                                                 int windowDays) {
            Map<String, List<NotificationDeliveryAttempt>> byChannel = attempts.stream()
                .collect(Collectors.groupingBy(NotificationDeliveryAttempt::getChannel));

            LocalDate today = LocalDate.now(ZoneOffset.UTC);
            List<String> orderedChannels = List.of("IN_APP", "SMS", "WHATSAPP", "PUSH");

            List<NotificationChannelDiagnosticsResponse> diagnostics = new ArrayList<>();
            for (String channel : orderedChannels) {
                List<NotificationDeliveryAttempt> channelAttempts = byChannel.getOrDefault(channel, List.of());
                diagnostics.add(toChannelDiagnostics(channel, channelAttempts, windowDays, today));
            }

            byChannel.entrySet().stream()
                .filter(entry -> !orderedChannels.contains(entry.getKey()))
                .sorted(Map.Entry.comparingByKey())
                .forEach(entry -> diagnostics.add(toChannelDiagnostics(entry.getKey(), entry.getValue(), windowDays, today)));

            return diagnostics;
            }

            private NotificationChannelDiagnosticsResponse toChannelDiagnostics(String channel,
                                               List<NotificationDeliveryAttempt> attempts,
                                               int windowDays,
                                               LocalDate today) {
            int totalAttempts = attempts.size();
            int deliveredCount = countByStatus(attempts, STATUS_DELIVERED);
            int failedCount = countByStatus(attempts, STATUS_FAILED);
            int skippedCount = countByStatus(attempts, STATUS_SKIPPED);

            List<NotificationDeliveryAttempt> retryAttempts = attempts.stream()
                .filter(NotificationDeliveryAttempt::isRetryAttempt)
                .toList();
            int retryDeliveredCount = countByStatus(retryAttempts, STATUS_DELIVERED);
            int retryFailedCount = countByStatus(retryAttempts, STATUS_FAILED);
            int retrySkippedCount = countByStatus(retryAttempts, STATUS_SKIPPED);

            List<NotificationFailureTrendPointResponse> trend = new ArrayList<>();
            Map<LocalDate, List<NotificationDeliveryAttempt>> byDate = attempts.stream()
                .collect(Collectors.groupingBy(attempt -> attempt.getAttemptedAt().atZone(ZoneOffset.UTC).toLocalDate()));

            for (int offset = windowDays - 1; offset >= 0; offset--) {
                LocalDate bucketDate = today.minusDays(offset);
                List<NotificationDeliveryAttempt> bucketAttempts = byDate.getOrDefault(bucketDate, List.of());
                int bucketTotal = bucketAttempts.size();
                int bucketFailed = countByStatus(bucketAttempts, STATUS_FAILED);
                double failureRatePercent = bucketTotal == 0 ? 0.0 : (bucketFailed * 100.0) / bucketTotal;
                trend.add(new NotificationFailureTrendPointResponse(
                    bucketDate.toString(),
                    bucketFailed,
                    bucketTotal,
                    roundTwoDecimals(failureRatePercent)
                ));
            }

            trend.sort(Comparator.comparing(NotificationFailureTrendPointResponse::bucketDate));

            return new NotificationChannelDiagnosticsResponse(
                channel,
                totalAttempts,
                deliveredCount,
                failedCount,
                skippedCount,
                retryAttempts.size(),
                retryDeliveredCount,
                retryFailedCount,
                retrySkippedCount,
                trend
            );
            }

            private static int countByStatus(List<NotificationDeliveryAttempt> attempts, String status) {
            return (int) attempts.stream()
                .filter(item -> status.equals(item.getStatus()))
                .count();
            }

            private static double roundTwoDecimals(double value) {
            return Math.round(value * 100.0) / 100.0;
            }

    private DeliveryProviderResult dispatchWithRetry(String channel, String destination, FarmerNotification notification) {
        NotificationProviderProperties.Channel channelConfig = channelConfig(channel);
        int maxAttempts = resolveMaxAttempts(channel, channelConfig);
        long initialBackoffMs = resolveInitialBackoffMs(channel, channelConfig);

        DeliveryProviderResult lastResult = DeliveryProviderResult.failed("Delivery failed");
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                lastResult = channelDispatcher.dispatch(channel, destination, notification);
            } catch (Exception ex) {
                log.warn("Channel dispatch failed unexpectedly channel={} notificationId={} attempt={}",
                        channel,
                        notification.getId(),
                        attempt,
                        ex);
                lastResult = DeliveryProviderResult.failed(ex.getMessage());
            }

            if (lastResult.isSuccess() || attempt >= maxAttempts || !isRetryable(channel, lastResult)) {
                return lastResult;
            }

            long backoffMs = calculateBackoffMs(initialBackoffMs, attempt);
            if (backoffMs > 0) {
                try {
                    Thread.sleep(backoffMs);
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                    return DeliveryProviderResult.failed("Delivery retry interrupted");
                }
            }
        }

        return lastResult;
    }

    private NotificationProviderProperties.Channel channelConfig(String channel) {
        if ("SMS".equals(channel)) {
            return providerProperties.getSms();
        }
        if ("WHATSAPP".equals(channel)) {
            return providerProperties.getWhatsapp();
        }
        if ("PUSH".equals(channel)) {
            return providerProperties.getPush();
        }
        return null;
    }

    private NotificationProviderPolicyResponse toPolicyResponse(String channel,
                                                                NotificationProviderProperties.Channel channelConfig) {
        int configuredMaxAttempts = channelConfig != null ? channelConfig.getMaxAttempts() : 1;
        long configuredInitialBackoffMs = channelConfig != null ? channelConfig.getInitialBackoffMs() : 0;
        int effectiveMaxAttempts = resolveMaxAttempts(channel, channelConfig);
        long effectiveInitialBackoffMs = resolveInitialBackoffMs(channel, channelConfig);
        boolean enabled = channelConfig != null && channelConfig.isEnabled();

        return new NotificationProviderPolicyResponse(
                channel,
                enabled,
                configuredMaxAttempts,
                effectiveMaxAttempts,
                configuredInitialBackoffMs,
                effectiveInitialBackoffMs
        );
    }

    private static int resolveMaxAttempts(String channel, NotificationProviderProperties.Channel channelConfig) {
        if (channelConfig == null || !isExternalChannel(channel)) {
            return 1;
        }
        return Math.max(1, Math.min(5, channelConfig.getMaxAttempts()));
    }

    private static long resolveInitialBackoffMs(String channel, NotificationProviderProperties.Channel channelConfig) {
        if (channelConfig == null || !isExternalChannel(channel)) {
            return 0;
        }
        return Math.max(0, Math.min(5_000, channelConfig.getInitialBackoffMs()));
    }

    private static long calculateBackoffMs(long initialBackoffMs, int attempt) {
        if (initialBackoffMs <= 0) {
            return 0;
        }
        long multiplier = 1L << Math.max(0, attempt - 1);
        long scaled = initialBackoffMs * multiplier;
        return Math.min(5_000, scaled);
    }

    private static boolean isRetryable(String channel, DeliveryProviderResult result) {
        if (!isExternalChannel(channel)) {
            return false;
        }
        String error = result.getErrorMessage();
        if (error == null || error.isBlank()) {
            return true;
        }

        String normalized = error.toLowerCase(Locale.ROOT);
        if (normalized.contains("not configured")
                || normalized.contains("missing destination")
                || normalized.contains("channel is required")) {
            return false;
        }

        return !normalized.contains("returned status 4");
    }

    private static boolean isExternalChannel(String channel) {
        return "SMS".equals(channel) || "WHATSAPP".equals(channel) || "PUSH".equals(channel);
    }

    private static String normalizeExternalChannel(String channel) {
        if (channel == null || channel.isBlank()) {
            return null;
        }
        String normalized = channel.trim().toUpperCase(Locale.ROOT);
        return isExternalChannel(normalized) ? normalized : null;
    }

    private static String normalizeCallbackStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        String normalized = status.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case STATUS_DELIVERED, STATUS_FAILED, STATUS_SKIPPED -> normalized;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported status");
        };
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private NotificationDeliveryAttemptResponse toResponse(NotificationDeliveryAttempt attempt) {
        return new NotificationDeliveryAttemptResponse(
                attempt.getId(),
                attempt.getNotificationId(),
                attempt.getChannel(),
                attempt.getStatus(),
                attempt.getDestination(),
                attempt.getProviderRef(),
                attempt.getProviderStatusCode(),
                attempt.getProviderMessage(),
                attempt.getErrorMessage(),
                attempt.isRetryAttempt(),
                attempt.getAttemptedAt()
        );
    }
}