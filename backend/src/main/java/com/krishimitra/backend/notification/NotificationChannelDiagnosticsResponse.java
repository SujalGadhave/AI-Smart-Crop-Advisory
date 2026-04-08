package com.krishimitra.backend.notification;

import java.util.List;

public record NotificationChannelDiagnosticsResponse(
        String channel,
        int totalAttempts,
        int deliveredCount,
        int failedCount,
        int skippedCount,
        int retryAttempts,
        int retryDeliveredCount,
        int retryFailedCount,
        int retrySkippedCount,
        List<NotificationFailureTrendPointResponse> failureTrend
) {
}
