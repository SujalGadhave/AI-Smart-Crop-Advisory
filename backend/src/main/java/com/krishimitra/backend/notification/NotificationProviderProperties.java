package com.krishimitra.backend.notification;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "notifications.providers")
public class NotificationProviderProperties {
    private final Channel sms = new Channel();
    private final Channel whatsapp = new Channel();
    private final Channel push = new Channel();

    public Channel getSms() {
        return sms;
    }

    public Channel getWhatsapp() {
        return whatsapp;
    }

    public Channel getPush() {
        return push;
    }

    public static class Channel {
        private boolean enabled;
        private String webhookUrl;
        private String authToken;
        private String callbackToken;
        private int maxAttempts = 1;
        private long initialBackoffMs = 0;

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public String getWebhookUrl() {
            return webhookUrl;
        }

        public void setWebhookUrl(String webhookUrl) {
            this.webhookUrl = webhookUrl;
        }

        public String getAuthToken() {
            return authToken;
        }

        public void setAuthToken(String authToken) {
            this.authToken = authToken;
        }

        public String getCallbackToken() {
            return callbackToken;
        }

        public void setCallbackToken(String callbackToken) {
            this.callbackToken = callbackToken;
        }

        public int getMaxAttempts() {
            return maxAttempts;
        }

        public void setMaxAttempts(int maxAttempts) {
            this.maxAttempts = maxAttempts;
        }

        public long getInitialBackoffMs() {
            return initialBackoffMs;
        }

        public void setInitialBackoffMs(long initialBackoffMs) {
            this.initialBackoffMs = initialBackoffMs;
        }
    }
}