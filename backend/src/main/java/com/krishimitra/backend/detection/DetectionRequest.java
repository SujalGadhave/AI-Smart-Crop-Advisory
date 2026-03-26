package com.krishimitra.backend.detection;

import jakarta.validation.constraints.NotBlank;

public class DetectionRequest {
    @NotBlank
    private String cropType;
    @NotBlank
    private String imageBase64;

    public String getCropType() {
        return cropType;
    }

    public void setCropType(String cropType) {
        this.cropType = cropType;
    }

    public String getImageBase64() {
        return imageBase64;
    }

    public void setImageBase64(String imageBase64) {
        this.imageBase64 = imageBase64;
    }
}
