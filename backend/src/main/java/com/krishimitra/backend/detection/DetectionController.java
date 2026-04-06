package com.krishimitra.backend.detection;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/crop")
@CrossOrigin(origins = "*")
public class DetectionController {

    private static final Logger log = LoggerFactory.getLogger(DetectionController.class);
    private final DetectionService detectionService;

    public DetectionController(DetectionService detectionService) {
        this.detectionService = detectionService;
    }

    @PostMapping("/detect")
    public ResponseEntity<DetectionResponse> detect(@Valid @RequestBody DetectionRequest request) {
        try {
            DetectionResponse response = detectionService.detect(request);
            if (Boolean.TRUE.equals(response.getError())) {
                return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(response);
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Detection failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new DetectionResponse(true, "DETECTION_FAILED", "Detection failed. Please retry."));
        }
    }

    @GetMapping("/reports")
    public List<DetectionResponse> getRecentReports(@RequestParam(value = "limit", defaultValue = "10") int limit) {
        int safeLimit = Math.max(1, Math.min(50, limit));
        return detectionService.getRecentReports(safeLimit);
    }
}
