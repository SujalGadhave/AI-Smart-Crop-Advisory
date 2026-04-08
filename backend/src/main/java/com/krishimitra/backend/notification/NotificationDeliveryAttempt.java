package com.krishimitra.backend.notification;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "notification_delivery_attempts")
public class NotificationDeliveryAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String farmerEmail;

    @Column(nullable = false)
    private Long notificationId;

    @Column(nullable = false, length = 24)
    private String channel;

    @Column(nullable = false, length = 16)
    private String status;

    @Column(length = 200)
    private String destination;

    @Column(length = 100)
    private String providerRef;

    private Integer providerStatusCode;

    @Column(length = 400)
    private String providerMessage;

    @Column(length = 400)
    private String errorMessage;

    @Column(nullable = false)
    private boolean retryAttempt = false;

    @Column(nullable = false)
    private Instant attemptedAt = Instant.now();

    public NotificationDeliveryAttempt() {
    }

    public NotificationDeliveryAttempt(String farmerEmail,
                                       Long notificationId,
                                       String channel,
                                       String status,
                                       String destination,
                                       String providerRef,
                                       String errorMessage) {
        this(farmerEmail, notificationId, channel, status, destination, providerRef, null, null, errorMessage, false);
    }

    public NotificationDeliveryAttempt(String farmerEmail,
                                       Long notificationId,
                                       String channel,
                                       String status,
                                       String destination,
                                       String providerRef,
                                       Integer providerStatusCode,
                                       String providerMessage,
                                       String errorMessage) {
        this(farmerEmail,
                notificationId,
                channel,
                status,
                destination,
                providerRef,
                providerStatusCode,
                providerMessage,
                errorMessage,
                false);
    }

    public NotificationDeliveryAttempt(String farmerEmail,
                                       Long notificationId,
                                       String channel,
                                       String status,
                                       String destination,
                                       String providerRef,
                                       Integer providerStatusCode,
                                       String providerMessage,
                                       String errorMessage,
                                       boolean retryAttempt) {
        this.farmerEmail = farmerEmail;
        this.notificationId = notificationId;
        this.channel = channel;
        this.status = status;
        this.destination = destination;
        this.providerRef = providerRef;
        this.providerStatusCode = providerStatusCode;
        this.providerMessage = providerMessage;
        this.errorMessage = errorMessage;
        this.retryAttempt = retryAttempt;
    }

    public Long getId() {
        return id;
    }

    public String getFarmerEmail() {
        return farmerEmail;
    }

    public void setFarmerEmail(String farmerEmail) {
        this.farmerEmail = farmerEmail;
    }

    public Long getNotificationId() {
        return notificationId;
    }

    public void setNotificationId(Long notificationId) {
        this.notificationId = notificationId;
    }

    public String getChannel() {
        return channel;
    }

    public void setChannel(String channel) {
        this.channel = channel;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public String getProviderRef() {
        return providerRef;
    }

    public void setProviderRef(String providerRef) {
        this.providerRef = providerRef;
    }

    public Integer getProviderStatusCode() {
        return providerStatusCode;
    }

    public void setProviderStatusCode(Integer providerStatusCode) {
        this.providerStatusCode = providerStatusCode;
    }

    public String getProviderMessage() {
        return providerMessage;
    }

    public void setProviderMessage(String providerMessage) {
        this.providerMessage = providerMessage;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public boolean isRetryAttempt() {
        return retryAttempt;
    }

    public void setRetryAttempt(boolean retryAttempt) {
        this.retryAttempt = retryAttempt;
    }

    public Instant getAttemptedAt() {
        return attemptedAt;
    }

    public void setAttemptedAt(Instant attemptedAt) {
        this.attemptedAt = attemptedAt;
    }
}