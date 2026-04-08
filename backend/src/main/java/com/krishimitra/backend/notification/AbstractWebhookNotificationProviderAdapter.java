package com.krishimitra.backend.notification;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

public abstract class AbstractWebhookNotificationProviderAdapter implements ExternalNotificationProviderAdapter {
    private final RestTemplate restTemplate;

    protected AbstractWebhookNotificationProviderAdapter(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    protected abstract NotificationProviderProperties.Channel channelProperties();

    @Override
    public boolean enabled() {
        return channelProperties().isEnabled();
    }

    @Override
    public DeliveryProviderResult send(String destination, FarmerNotification notification) {
        NotificationProviderProperties.Channel config = channelProperties();
        String webhookUrl = trimToNull(config.getWebhookUrl());
        if (webhookUrl == null) {
            return DeliveryProviderResult.failed(channel() + " provider webhookUrl is not configured", null, "Missing webhookUrl");
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("channel", channel());
        payload.put("destination", destination);
        payload.put("notificationId", notification.getId());
        payload.put("farmerEmail", notification.getFarmerEmail());
        payload.put("type", notification.getType());
        payload.put("level", notification.getLevel());
        payload.put("title", notification.getTitle());
        payload.put("message", notification.getMessage());
        payload.put("createdAt", notification.getCreatedAt());
        payload.put("requestedAt", Instant.now().toString());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String authToken = trimToNull(config.getAuthToken());
        if (authToken != null) {
            headers.setBearerAuth(authToken);
        }

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(webhookUrl, new HttpEntity<>(payload, headers), Map.class);
            int providerStatusCode = response.getStatusCode().value();
            String providerMessage = extractProviderMessage(response.getBody());
            if (response.getStatusCode().is2xxSuccessful()) {
                String providerRef = extractProviderRef(response.getBody(), notification.getId());
                return DeliveryProviderResult.success(providerRef, providerStatusCode, providerMessage);
            }
            return DeliveryProviderResult.failed(
                    channel() + " provider returned status " + providerStatusCode,
                    providerStatusCode,
                    providerMessage
            );
        } catch (Exception ex) {
            return DeliveryProviderResult.failed(
                    channel() + " provider request failed: " + ex.getMessage(),
                    null,
                    ex.getClass().getSimpleName()
            );
        }
    }

    private String extractProviderRef(Map body, Long notificationId) {
        if (body == null) {
            return channel() + "-" + notificationId;
        }
        Object providerRef = body.get("providerRef");
        if (providerRef == null) {
            providerRef = body.get("id");
        }
        return providerRef != null ? String.valueOf(providerRef) : channel() + "-" + notificationId;
    }

    private String extractProviderMessage(Map body) {
        if (body == null) {
            return null;
        }
        Object message = body.get("message");
        if (message == null) {
            message = body.get("status");
        }
        if (message == null) {
            message = body.get("error");
        }
        return message != null ? String.valueOf(message) : null;
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}