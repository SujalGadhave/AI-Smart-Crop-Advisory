package com.krishimitra.backend.notification;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationChannelPreferenceService preferenceService;
    private final NotificationDeliveryService deliveryService;

    public NotificationController(NotificationService notificationService,
                                  NotificationChannelPreferenceService preferenceService,
                                  NotificationDeliveryService deliveryService) {
        this.notificationService = notificationService;
        this.preferenceService = preferenceService;
        this.deliveryService = deliveryService;
    }

    @GetMapping
    public List<FarmerNotificationResponse> getNotifications(@RequestParam(value = "limit", defaultValue = "20") int limit,
                                                             Authentication authentication) {
        String farmerEmail = requireFarmerEmail(authentication);
        int safeLimit = Math.max(1, Math.min(100, limit));
        return notificationService.getNotifications(farmerEmail, safeLimit);
    }

    @GetMapping("/unread-count")
    public Map<String, Long> getUnreadCount(Authentication authentication) {
        String farmerEmail = requireFarmerEmail(authentication);
        long unreadCount = notificationService.getUnreadCount(farmerEmail);
        return Map.of("count", unreadCount);
    }

    @PatchMapping("/{notificationId}/read")
    public FarmerNotificationResponse markAsRead(@PathVariable Long notificationId,
                                                 Authentication authentication) {
        String farmerEmail = requireFarmerEmail(authentication);
        return notificationService.markAsRead(notificationId, farmerEmail);
    }

    @PatchMapping("/read-all")
    public Map<String, Integer> markAllAsRead(Authentication authentication) {
        String farmerEmail = requireFarmerEmail(authentication);
        int updated = notificationService.markAllAsRead(farmerEmail);
        return Map.of("updated", updated);
    }

    @GetMapping("/preferences")
    public NotificationChannelPreferenceResponse getPreferences(Authentication authentication) {
        String farmerEmail = requireFarmerEmail(authentication);
        return preferenceService.getPreferences(farmerEmail);
    }

    @PutMapping("/preferences")
    public NotificationChannelPreferenceResponse updatePreferences(@RequestBody NotificationChannelPreferenceRequest request,
                                                                   Authentication authentication) {
        String farmerEmail = requireFarmerEmail(authentication);
        return preferenceService.updatePreferences(farmerEmail, request);
    }

    @GetMapping("/delivery-history")
    public List<NotificationDeliveryAttemptResponse> getDeliveryHistory(@RequestParam(value = "limit", defaultValue = "20") int limit,
                                                                        Authentication authentication) {
        String farmerEmail = requireFarmerEmail(authentication);
        return deliveryService.getDeliveryHistory(farmerEmail, limit);
    }

    @GetMapping("/provider-policy")
    public List<NotificationProviderPolicyResponse> getProviderPolicy(Authentication authentication) {
        requireFarmerEmail(authentication);
        return deliveryService.getProviderPolicySnapshot();
    }

    @GetMapping("/diagnostics")
    public NotificationDiagnosticsResponse getDiagnostics(@RequestParam(value = "windowDays", defaultValue = "7") int windowDays,
                                                         Authentication authentication) {
        String farmerEmail = requireFarmerEmail(authentication);
        return deliveryService.getDiagnostics(farmerEmail, windowDays);
    }

    @PostMapping("/delivery-history/{attemptId}/retry")
    public NotificationDeliveryAttemptResponse retryDeliveryAttempt(@PathVariable Long attemptId,
                                                                    Authentication authentication) {
        String farmerEmail = requireFarmerEmail(authentication);
        return deliveryService.retryAttempt(attemptId, farmerEmail);
    }

    @PostMapping("/provider-callbacks/{channel}")
    public NotificationDeliveryAttemptResponse processProviderCallback(@PathVariable String channel,
                                                                       @RequestHeader(value = "X-Provider-Token", required = false) String callbackToken,
                                                                       @RequestBody NotificationProviderCallbackRequest request) {
        return deliveryService.processProviderCallback(channel, callbackToken, request);
    }

    private String requireFarmerEmail(Authentication authentication) {
        String farmerEmail = authentication != null ? authentication.getName() : null;
        if (farmerEmail == null || farmerEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return farmerEmail;
    }
}