package com.krishimitra.backend.notification;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

@Service
public class NotificationChannelPreferenceService {
    private final NotificationChannelPreferenceRepository preferenceRepository;

    public NotificationChannelPreferenceService(NotificationChannelPreferenceRepository preferenceRepository) {
        this.preferenceRepository = preferenceRepository;
    }

    @Transactional
    public NotificationChannelPreference getOrCreate(String farmerEmail) {
        return preferenceRepository.findByFarmerEmail(farmerEmail)
                .orElseGet(() -> preferenceRepository.save(new NotificationChannelPreference(farmerEmail)));
    }

    @Transactional
    public NotificationChannelPreferenceResponse getPreferences(String farmerEmail) {
        NotificationChannelPreference preference = getOrCreate(farmerEmail);
        return toResponse(preference);
    }

    @Transactional
    public NotificationChannelPreferenceResponse updatePreferences(String farmerEmail,
                                                                   NotificationChannelPreferenceRequest request) {
        NotificationChannelPreference preference = getOrCreate(farmerEmail);

        String smsNumber = normalize(request.getSmsNumber());
        String whatsappNumber = normalize(request.getWhatsappNumber());
        String pushToken = normalize(request.getPushToken());

        if (request.isSmsEnabled() && smsNumber == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "smsNumber is required when smsEnabled is true");
        }
        if (request.isWhatsappEnabled() && whatsappNumber == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "whatsappNumber is required when whatsappEnabled is true");
        }
        if (request.isPushEnabled() && pushToken == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "pushToken is required when pushEnabled is true");
        }

        preference.setInAppEnabled(request.isInAppEnabled());
        preference.setSmsEnabled(request.isSmsEnabled());
        preference.setWhatsappEnabled(request.isWhatsappEnabled());
        preference.setPushEnabled(request.isPushEnabled());
        preference.setSmsNumber(smsNumber);
        preference.setWhatsappNumber(whatsappNumber);
        preference.setPushToken(pushToken);
        preference.setUpdatedAt(Instant.now());

        NotificationChannelPreference saved = preferenceRepository.save(preference);
        return toResponse(saved);
    }

    private static String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static NotificationChannelPreferenceResponse toResponse(NotificationChannelPreference preference) {
        return new NotificationChannelPreferenceResponse(
                preference.isInAppEnabled(),
                preference.isSmsEnabled(),
                preference.isWhatsappEnabled(),
                preference.isPushEnabled(),
                preference.getSmsNumber(),
                preference.getWhatsappNumber(),
                preference.getPushToken(),
                preference.getUpdatedAt()
        );
    }
}