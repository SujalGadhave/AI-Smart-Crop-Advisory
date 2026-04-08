package com.krishimitra.backend.notification;

import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@Primary
public class ProviderAwareNotificationChannelDispatcher implements NotificationChannelDispatcher {
    private final MockNotificationChannelDispatcher mockDispatcher;
    private final Map<String, ExternalNotificationProviderAdapter> adaptersByChannel;

    public ProviderAwareNotificationChannelDispatcher(MockNotificationChannelDispatcher mockDispatcher,
                                                      List<ExternalNotificationProviderAdapter> adapters) {
        this.mockDispatcher = mockDispatcher;
        this.adaptersByChannel = adapters.stream()
                .collect(Collectors.toMap(
                        adapter -> adapter.channel().toUpperCase(Locale.ROOT),
                        Function.identity(),
                        (left, right) -> left
                ));
    }

    @Override
    public DeliveryProviderResult dispatch(String channel, String destination, FarmerNotification notification) {
        if (channel == null) {
            return DeliveryProviderResult.failed("Channel is required");
        }

        String normalizedChannel = channel.toUpperCase(Locale.ROOT);
        if ("IN_APP".equals(normalizedChannel)) {
            return mockDispatcher.dispatch(channel, destination, notification);
        }

        ExternalNotificationProviderAdapter adapter = adaptersByChannel.get(normalizedChannel);
        if (adapter == null || !adapter.enabled()) {
            return mockDispatcher.dispatch(channel, destination, notification);
        }

        return adapter.send(destination, notification);
    }
}