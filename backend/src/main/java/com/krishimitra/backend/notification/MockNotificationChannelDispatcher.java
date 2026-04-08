package com.krishimitra.backend.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.UUID;

@Component
public class MockNotificationChannelDispatcher implements NotificationChannelDispatcher {
    private static final Logger log = LoggerFactory.getLogger(MockNotificationChannelDispatcher.class);

    @Override
    public DeliveryProviderResult dispatch(String channel, String destination, FarmerNotification notification) {
        String normalizedChannel = channel == null ? "UNKNOWN" : channel.toUpperCase(Locale.ROOT);
        if ("IN_APP".equals(normalizedChannel)) {
            return DeliveryProviderResult.success("INAPP-" + notification.getId(), 200, "In-app notification created");
        }

        log.info("Mock provider dispatch channel={} notificationId={} destination={}",
                normalizedChannel,
                notification.getId(),
                destination);

        String providerRef = normalizedChannel + "-" + UUID.randomUUID();
        return DeliveryProviderResult.success(providerRef, 202, "Mock provider accepted request");
    }
}