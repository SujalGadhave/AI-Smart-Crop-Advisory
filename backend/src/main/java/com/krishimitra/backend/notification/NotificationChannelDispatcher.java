package com.krishimitra.backend.notification;

public interface NotificationChannelDispatcher {
    DeliveryProviderResult dispatch(String channel, String destination, FarmerNotification notification);
}