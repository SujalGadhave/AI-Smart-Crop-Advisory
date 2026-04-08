package com.krishimitra.backend.notification;

public record NotificationFailureTrendPointResponse(
        String bucketDate,
        int failedCount,
        int totalCount,
        double failureRatePercent
) {
}
