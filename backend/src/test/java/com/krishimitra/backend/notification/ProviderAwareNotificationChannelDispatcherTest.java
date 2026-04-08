package com.krishimitra.backend.notification;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProviderAwareNotificationChannelDispatcherTest {

    @Test
    void dispatchUsesExternalAdapterWhenEnabled() {
        MockNotificationChannelDispatcher mockDispatcher = mock(MockNotificationChannelDispatcher.class);
        ExternalNotificationProviderAdapter smsAdapter = mock(ExternalNotificationProviderAdapter.class);

        when(smsAdapter.channel()).thenReturn("SMS");
        when(smsAdapter.enabled()).thenReturn(true);
        when(smsAdapter.send(anyString(), any(FarmerNotification.class)))
                .thenReturn(DeliveryProviderResult.success("EXT-SMS-123"));

        ProviderAwareNotificationChannelDispatcher dispatcher =
                new ProviderAwareNotificationChannelDispatcher(mockDispatcher, List.of(smsAdapter));

        DeliveryProviderResult result = dispatcher.dispatch("SMS", "+919900112233", sampleNotification());

        assertTrue(result.isSuccess());
        assertEquals("EXT-SMS-123", result.getProviderRef());
        verify(smsAdapter).send(anyString(), any(FarmerNotification.class));
        verify(mockDispatcher, never()).dispatch(anyString(), anyString(), any(FarmerNotification.class));
    }

    @Test
    void dispatchFallsBackToMockWhenAdapterIsDisabled() {
        MockNotificationChannelDispatcher mockDispatcher = mock(MockNotificationChannelDispatcher.class);
        ExternalNotificationProviderAdapter smsAdapter = mock(ExternalNotificationProviderAdapter.class);

        when(smsAdapter.channel()).thenReturn("SMS");
        when(smsAdapter.enabled()).thenReturn(false);
        when(mockDispatcher.dispatch(anyString(), anyString(), any(FarmerNotification.class)))
                .thenReturn(DeliveryProviderResult.success("MOCK-SMS-123"));

        ProviderAwareNotificationChannelDispatcher dispatcher =
                new ProviderAwareNotificationChannelDispatcher(mockDispatcher, List.of(smsAdapter));

        DeliveryProviderResult result = dispatcher.dispatch("SMS", "+919900112233", sampleNotification());

        assertTrue(result.isSuccess());
        assertEquals("MOCK-SMS-123", result.getProviderRef());
        verify(mockDispatcher).dispatch(anyString(), anyString(), any(FarmerNotification.class));
        verify(smsAdapter, never()).send(anyString(), any(FarmerNotification.class));
    }

    @Test
    void dispatchFallsBackToMockWhenNoAdapterExistsForChannel() {
        MockNotificationChannelDispatcher mockDispatcher = mock(MockNotificationChannelDispatcher.class);
        when(mockDispatcher.dispatch(anyString(), anyString(), any(FarmerNotification.class)))
                .thenReturn(DeliveryProviderResult.success("MOCK-WHATSAPP-123"));

        ProviderAwareNotificationChannelDispatcher dispatcher =
                new ProviderAwareNotificationChannelDispatcher(mockDispatcher, List.of());

        DeliveryProviderResult result = dispatcher.dispatch("WHATSAPP", "+919900223344", sampleNotification());

        assertTrue(result.isSuccess());
        assertEquals("MOCK-WHATSAPP-123", result.getProviderRef());
        verify(mockDispatcher).dispatch(anyString(), anyString(), any(FarmerNotification.class));
    }

    @Test
    void dispatchReturnsFailureWhenChannelIsMissing() {
        MockNotificationChannelDispatcher mockDispatcher = mock(MockNotificationChannelDispatcher.class);

        ProviderAwareNotificationChannelDispatcher dispatcher =
                new ProviderAwareNotificationChannelDispatcher(mockDispatcher, List.of());

        DeliveryProviderResult result = dispatcher.dispatch(null, "+919900223344", sampleNotification());

        assertFalse(result.isSuccess());
        assertEquals("Channel is required", result.getErrorMessage());
        verify(mockDispatcher, never()).dispatch(anyString(), anyString(), any(FarmerNotification.class));
    }

    private FarmerNotification sampleNotification() {
        return new FarmerNotification(
                "farmer@example.com",
                "RISK_ALERT",
                "RISK_ALERT_101",
                101L,
                "HIGH",
                "HIGH_RISK_DETECTED",
                "Late blight risk is high",
                Instant.now()
        );
    }
}
