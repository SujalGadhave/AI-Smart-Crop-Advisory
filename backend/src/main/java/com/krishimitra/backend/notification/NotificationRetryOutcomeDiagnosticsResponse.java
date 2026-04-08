package com.krishimitra.backend.notification;

public record NotificationRetryOutcomeDiagnosticsResponse(
        int totalRetries,
        int deliveredRetries,
        int failedRetries,
        int skippedRetries,
        double successRatePercent
) {
}
