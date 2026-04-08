package com.krishimitra.backend.notification;

public interface ExternalNotificationProviderAdapter {
    String channel();

    boolean enabled();

    DeliveryProviderResult send(String destination, FarmerNotification notification);
}