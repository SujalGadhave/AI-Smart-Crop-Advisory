package com.krishimitra.backend.notification;

import java.time.Instant;

public class NotificationChannelPreferenceResponse {
    private final boolean inAppEnabled;
    private final boolean smsEnabled;
    private final boolean whatsappEnabled;
    private final boolean pushEnabled;
    private final String smsNumber;
    private final String whatsappNumber;
    private final String pushToken;
    private final Instant updatedAt;

    public NotificationChannelPreferenceResponse(boolean inAppEnabled,
                                                 boolean smsEnabled,
                                                 boolean whatsappEnabled,
                                                 boolean pushEnabled,
                                                 String smsNumber,
                                                 String whatsappNumber,
                                                 String pushToken,
                                                 Instant updatedAt) {
        this.inAppEnabled = inAppEnabled;
        this.smsEnabled = smsEnabled;
        this.whatsappEnabled = whatsappEnabled;
        this.pushEnabled = pushEnabled;
        this.smsNumber = smsNumber;
        this.whatsappNumber = whatsappNumber;
        this.pushToken = pushToken;
        this.updatedAt = updatedAt;
    }

    public boolean isInAppEnabled() {
        return inAppEnabled;
    }

    public boolean isSmsEnabled() {
        return smsEnabled;
    }

    public boolean isWhatsappEnabled() {
        return whatsappEnabled;
    }

    public boolean isPushEnabled() {
        return pushEnabled;
    }

    public String getSmsNumber() {
        return smsNumber;
    }

    public String getWhatsappNumber() {
        return whatsappNumber;
    }

    public String getPushToken() {
        return pushToken;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}