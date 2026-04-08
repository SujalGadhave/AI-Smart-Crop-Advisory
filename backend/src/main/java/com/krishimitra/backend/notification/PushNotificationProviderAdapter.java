package com.krishimitra.backend.notification;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class PushNotificationProviderAdapter extends AbstractWebhookNotificationProviderAdapter {
    private final NotificationProviderProperties properties;

    public PushNotificationProviderAdapter(RestTemplate restTemplate,
                                           NotificationProviderProperties properties) {
        super(restTemplate);
        this.properties = properties;
    }

    @Override
    public String channel() {
        return "PUSH";
    }

    @Override
    protected NotificationProviderProperties.Channel channelProperties() {
        return properties.getPush();
    }
}