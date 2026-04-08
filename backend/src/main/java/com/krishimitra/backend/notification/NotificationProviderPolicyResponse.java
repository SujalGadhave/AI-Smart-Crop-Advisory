package com.krishimitra.backend.notification;

public record NotificationProviderPolicyResponse(
        String channel,
        boolean enabled,
        int configuredMaxAttempts,
        int effectiveMaxAttempts,
        long configuredInitialBackoffMs,
        long effectiveInitialBackoffMs
) {
}