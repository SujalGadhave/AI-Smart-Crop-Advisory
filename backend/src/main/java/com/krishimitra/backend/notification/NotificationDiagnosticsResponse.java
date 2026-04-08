package com.krishimitra.backend.notification;

import java.time.Instant;
import java.util.List;

public record NotificationDiagnosticsResponse(
        Instant generatedAt,
        int windowDays,
        NotificationRetryOutcomeDiagnosticsResponse retryOutcomes,
        List<NotificationChannelDiagnosticsResponse> channels
) {
}
