package com.krishimitra.backend.notification;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.mockito.ArgumentCaptor;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class NotificationDeliveryServiceTest {

    @Test
    void smsRetriesAndEventuallyDelivers() {
        NotificationDeliveryAttemptRepository attemptRepository = mock(NotificationDeliveryAttemptRepository.class);
                FarmerNotificationRepository notificationRepository = mock(FarmerNotificationRepository.class);
        NotificationChannelPreferenceService preferenceService = mock(NotificationChannelPreferenceService.class);
        NotificationChannelDispatcher channelDispatcher = mock(NotificationChannelDispatcher.class);
        NotificationProviderProperties providerProperties = new NotificationProviderProperties();

        providerProperties.getSms().setMaxAttempts(3);
        providerProperties.getSms().setInitialBackoffMs(0);

        NotificationChannelPreference preference = new NotificationChannelPreference("farmer@example.com");
        preference.setInAppEnabled(false);
        preference.setSmsEnabled(true);
        preference.setWhatsappEnabled(false);
        preference.setPushEnabled(false);
        preference.setSmsNumber("+919900112233");

        when(preferenceService.getOrCreate("farmer@example.com")).thenReturn(preference);
        when(channelDispatcher.dispatch(eq("SMS"), eq("+919900112233"), any(FarmerNotification.class)))
                .thenReturn(DeliveryProviderResult.failed("SMS provider returned status 503"))
                .thenReturn(DeliveryProviderResult.success("SMS-REF-1"));
        when(attemptRepository.save(any(NotificationDeliveryAttempt.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NotificationDeliveryService service = new NotificationDeliveryService(
                attemptRepository,
                notificationRepository,
                preferenceService,
                channelDispatcher,
                providerProperties
        );

        service.dispatch(sampleNotification());

        verify(channelDispatcher, times(2)).dispatch(eq("SMS"), eq("+919900112233"), any(FarmerNotification.class));
        verify(attemptRepository, times(4)).save(any(NotificationDeliveryAttempt.class));
    }

    @Test
    void smsMisconfigurationDoesNotRetry() {
        NotificationDeliveryAttemptRepository attemptRepository = mock(NotificationDeliveryAttemptRepository.class);
                FarmerNotificationRepository notificationRepository = mock(FarmerNotificationRepository.class);
        NotificationChannelPreferenceService preferenceService = mock(NotificationChannelPreferenceService.class);
        NotificationChannelDispatcher channelDispatcher = mock(NotificationChannelDispatcher.class);
        NotificationProviderProperties providerProperties = new NotificationProviderProperties();

        providerProperties.getSms().setMaxAttempts(3);
        providerProperties.getSms().setInitialBackoffMs(0);

        NotificationChannelPreference preference = new NotificationChannelPreference("farmer@example.com");
        preference.setInAppEnabled(false);
        preference.setSmsEnabled(true);
        preference.setWhatsappEnabled(false);
        preference.setPushEnabled(false);
        preference.setSmsNumber("+919900112233");

        when(preferenceService.getOrCreate("farmer@example.com")).thenReturn(preference);
        when(channelDispatcher.dispatch(eq("SMS"), eq("+919900112233"), any(FarmerNotification.class)))
                .thenReturn(DeliveryProviderResult.failed("SMS provider webhookUrl is not configured"));
        when(attemptRepository.save(any(NotificationDeliveryAttempt.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NotificationDeliveryService service = new NotificationDeliveryService(
                attemptRepository,
                notificationRepository,
                preferenceService,
                channelDispatcher,
                providerProperties
        );

        service.dispatch(sampleNotification());

        verify(channelDispatcher, times(1)).dispatch(eq("SMS"), eq("+919900112233"), any(FarmerNotification.class));
        verify(attemptRepository, times(4)).save(any(NotificationDeliveryAttempt.class));
    }

    @Test
    void successfulSmsAttemptPersistsProviderMetadata() {
        NotificationDeliveryAttemptRepository attemptRepository = mock(NotificationDeliveryAttemptRepository.class);
                FarmerNotificationRepository notificationRepository = mock(FarmerNotificationRepository.class);
        NotificationChannelPreferenceService preferenceService = mock(NotificationChannelPreferenceService.class);
        NotificationChannelDispatcher channelDispatcher = mock(NotificationChannelDispatcher.class);
        NotificationProviderProperties providerProperties = new NotificationProviderProperties();

        providerProperties.getSms().setMaxAttempts(1);
        providerProperties.getSms().setInitialBackoffMs(0);

        NotificationChannelPreference preference = new NotificationChannelPreference("farmer@example.com");
        preference.setInAppEnabled(false);
        preference.setSmsEnabled(true);
        preference.setWhatsappEnabled(false);
        preference.setPushEnabled(false);
        preference.setSmsNumber("+919900112233");

        when(preferenceService.getOrCreate("farmer@example.com")).thenReturn(preference);
        when(channelDispatcher.dispatch(eq("SMS"), eq("+919900112233"), any(FarmerNotification.class)))
                .thenReturn(DeliveryProviderResult.success("SMS-REF-42", 202, "Accepted by provider queue"));
        when(attemptRepository.save(any(NotificationDeliveryAttempt.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NotificationDeliveryService service = new NotificationDeliveryService(
                attemptRepository,
                notificationRepository,
                preferenceService,
                channelDispatcher,
                providerProperties
        );

        service.dispatch(sampleNotification());

        ArgumentCaptor<NotificationDeliveryAttempt> captor = ArgumentCaptor.forClass(NotificationDeliveryAttempt.class);
        verify(attemptRepository, times(4)).save(captor.capture());

        NotificationDeliveryAttempt smsAttempt = captor.getAllValues().stream()
                .filter(item -> "SMS".equals(item.getChannel()))
                .findFirst()
                .orElseThrow();

        assertEquals("DELIVERED", smsAttempt.getStatus());
        assertEquals("SMS-REF-42", smsAttempt.getProviderRef());
        assertEquals(202, smsAttempt.getProviderStatusCode());
        assertEquals("Accepted by provider queue", smsAttempt.getProviderMessage());
    }

    @Test
    void whatsappRetriesAndEventuallyDelivers() {
        NotificationDeliveryAttemptRepository attemptRepository = mock(NotificationDeliveryAttemptRepository.class);
                FarmerNotificationRepository notificationRepository = mock(FarmerNotificationRepository.class);
        NotificationChannelPreferenceService preferenceService = mock(NotificationChannelPreferenceService.class);
        NotificationChannelDispatcher channelDispatcher = mock(NotificationChannelDispatcher.class);
        NotificationProviderProperties providerProperties = new NotificationProviderProperties();

        providerProperties.getWhatsapp().setMaxAttempts(3);
        providerProperties.getWhatsapp().setInitialBackoffMs(0);

        NotificationChannelPreference preference = new NotificationChannelPreference("farmer@example.com");
        preference.setInAppEnabled(false);
        preference.setSmsEnabled(false);
        preference.setWhatsappEnabled(true);
        preference.setPushEnabled(false);
        preference.setWhatsappNumber("+919900998877");

        when(preferenceService.getOrCreate("farmer@example.com")).thenReturn(preference);
        when(channelDispatcher.dispatch(eq("WHATSAPP"), eq("+919900998877"), any(FarmerNotification.class)))
                .thenReturn(DeliveryProviderResult.failed("WHATSAPP provider returned status 503"))
                .thenReturn(DeliveryProviderResult.success("WA-REF-1", 202, "Queued"));
        when(attemptRepository.save(any(NotificationDeliveryAttempt.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NotificationDeliveryService service = new NotificationDeliveryService(
                attemptRepository,
                notificationRepository,
                preferenceService,
                channelDispatcher,
                providerProperties
        );

        service.dispatch(sampleNotification());

        verify(channelDispatcher, times(2)).dispatch(eq("WHATSAPP"), eq("+919900998877"), any(FarmerNotification.class));
        verify(attemptRepository, times(4)).save(any(NotificationDeliveryAttempt.class));
    }

    @Test
    void pushClientErrorDoesNotRetry() {
        NotificationDeliveryAttemptRepository attemptRepository = mock(NotificationDeliveryAttemptRepository.class);
                FarmerNotificationRepository notificationRepository = mock(FarmerNotificationRepository.class);
        NotificationChannelPreferenceService preferenceService = mock(NotificationChannelPreferenceService.class);
        NotificationChannelDispatcher channelDispatcher = mock(NotificationChannelDispatcher.class);
        NotificationProviderProperties providerProperties = new NotificationProviderProperties();

        providerProperties.getPush().setMaxAttempts(4);
        providerProperties.getPush().setInitialBackoffMs(0);

        NotificationChannelPreference preference = new NotificationChannelPreference("farmer@example.com");
        preference.setInAppEnabled(false);
        preference.setSmsEnabled(false);
        preference.setWhatsappEnabled(false);
        preference.setPushEnabled(true);
        preference.setPushToken("push-token-123");

        when(preferenceService.getOrCreate("farmer@example.com")).thenReturn(preference);
        when(channelDispatcher.dispatch(eq("PUSH"), eq("push-token-123"), any(FarmerNotification.class)))
                .thenReturn(DeliveryProviderResult.failed("PUSH provider returned status 401"));
        when(attemptRepository.save(any(NotificationDeliveryAttempt.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NotificationDeliveryService service = new NotificationDeliveryService(
                attemptRepository,
                notificationRepository,
                preferenceService,
                channelDispatcher,
                providerProperties
        );

        service.dispatch(sampleNotification());

        verify(channelDispatcher, times(1)).dispatch(eq("PUSH"), eq("push-token-123"), any(FarmerNotification.class));
        verify(attemptRepository, times(4)).save(any(NotificationDeliveryAttempt.class));
    }

    @SuppressWarnings("unchecked")
    private static FarmerNotification sampleNotification() {
        FarmerNotification notification = new FarmerNotification(
                "farmer@example.com",
                "RISK_ALERT",
                "RISK_ALERT_100",
                100L,
                "HIGH",
                "HIGH_RISK_DETECTED",
                "Possible disease spread",
                Instant.now()
        );
        ReflectionTestUtils.setField(notification, "id", 1000L);
        return notification;
    }
}
