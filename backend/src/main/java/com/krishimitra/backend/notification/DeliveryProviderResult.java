package com.krishimitra.backend.notification;

public class DeliveryProviderResult {
    private final boolean success;
    private final String providerRef;
    private final String errorMessage;
    private final Integer providerStatusCode;
    private final String providerMessage;

    private DeliveryProviderResult(boolean success,
                                   String providerRef,
                                   String errorMessage,
                                   Integer providerStatusCode,
                                   String providerMessage) {
        this.success = success;
        this.providerRef = providerRef;
        this.errorMessage = errorMessage;
        this.providerStatusCode = providerStatusCode;
        this.providerMessage = providerMessage;
    }

    public static DeliveryProviderResult success(String providerRef) {
        return success(providerRef, null, null);
    }

    public static DeliveryProviderResult success(String providerRef,
                                                 Integer providerStatusCode,
                                                 String providerMessage) {
        return new DeliveryProviderResult(true, providerRef, null, providerStatusCode, providerMessage);
    }

    public static DeliveryProviderResult failed(String errorMessage) {
        return failed(errorMessage, null, null);
    }

    public static DeliveryProviderResult failed(String errorMessage,
                                                Integer providerStatusCode,
                                                String providerMessage) {
        return new DeliveryProviderResult(false, null, errorMessage, providerStatusCode, providerMessage);
    }

    public boolean isSuccess() {
        return success;
    }

    public String getProviderRef() {
        return providerRef;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public Integer getProviderStatusCode() {
        return providerStatusCode;
    }

    public String getProviderMessage() {
        return providerMessage;
    }
}