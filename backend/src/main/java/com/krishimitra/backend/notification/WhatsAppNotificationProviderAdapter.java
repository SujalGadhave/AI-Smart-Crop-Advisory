package com.krishimitra.backend.notification;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class WhatsAppNotificationProviderAdapter extends AbstractWebhookNotificationProviderAdapter {
    private final NotificationProviderProperties properties;

    public WhatsAppNotificationProviderAdapter(RestTemplate restTemplate,
                                               NotificationProviderProperties properties) {
        super(restTemplate);
        this.properties = properties;
    }

    @Override
    public String channel() {
        return "WHATSAPP";
    }

    @Override
    protected NotificationProviderProperties.Channel channelProperties() {
        return properties.getWhatsapp();
    }
}