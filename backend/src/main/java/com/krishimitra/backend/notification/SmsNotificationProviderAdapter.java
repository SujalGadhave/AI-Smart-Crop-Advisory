package com.krishimitra.backend.notification;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class SmsNotificationProviderAdapter extends AbstractWebhookNotificationProviderAdapter {
    private final NotificationProviderProperties properties;

    public SmsNotificationProviderAdapter(RestTemplate restTemplate,
                                          NotificationProviderProperties properties) {
        super(restTemplate);
        this.properties = properties;
    }

    @Override
    public String channel() {
        return "SMS";
    }

    @Override
    protected NotificationProviderProperties.Channel channelProperties() {
        return properties.getSms();
    }
}