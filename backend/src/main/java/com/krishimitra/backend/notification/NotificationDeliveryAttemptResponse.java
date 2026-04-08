package com.krishimitra.backend.notification;

import java.time.Instant;

public class NotificationDeliveryAttemptResponse {
    private final Long attemptId;
    private final Long notificationId;
    private final String channel;
    private final String status;
    private final String destination;
    private final String providerRef;
    private final Integer providerStatusCode;
    private final String providerMessage;
    private final String errorMessage;
    private final boolean retryAttempt;
    private final Instant attemptedAt;

    public NotificationDeliveryAttemptResponse(Long attemptId,
                                               Long notificationId,
                                               String channel,
                                               String status,
                                               String destination,
                                               String providerRef,
                                               Integer providerStatusCode,
                                               String providerMessage,
                                               String errorMessage,
                                               boolean retryAttempt,
                                               Instant attemptedAt) {
        this.attemptId = attemptId;
        this.notificationId = notificationId;
        this.channel = channel;
        this.status = status;
        this.destination = destination;
        this.providerRef = providerRef;
        this.providerStatusCode = providerStatusCode;
        this.providerMessage = providerMessage;
        this.errorMessage = errorMessage;
        this.retryAttempt = retryAttempt;
        this.attemptedAt = attemptedAt;
    }

    public Long getAttemptId() {
        return attemptId;
    }

    public Long getNotificationId() {
        return notificationId;
    }

    public String getChannel() {
        return channel;
    }

    public String getStatus() {
        return status;
    }

    public String getDestination() {
        return destination;
    }

    public String getProviderRef() {
        return providerRef;
    }

    public Integer getProviderStatusCode() {
        return providerStatusCode;
    }

    public String getProviderMessage() {
        return providerMessage;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public boolean isRetryAttempt() {
        return retryAttempt;
    }

    public Instant getAttemptedAt() {
        return attemptedAt;
    }
}