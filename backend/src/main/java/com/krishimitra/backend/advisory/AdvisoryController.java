package com.krishimitra.backend.advisory;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/advisory")
@CrossOrigin(origins = "*")
public class AdvisoryController {

    private final AdvisoryService advisoryService;

    public AdvisoryController(AdvisoryService advisoryService) {
        this.advisoryService = advisoryService;
    }

    @GetMapping
    public AdvisoryResponse getAdvisory(@RequestParam("cropType") String cropType,
                                        @RequestParam(value = "season", required = false, defaultValue = "kharif") String season,
                                        @RequestParam(value = "diseaseName", required = false) String diseaseName,
                                        @RequestParam(value = "city", required = false, defaultValue = "") String city) {
        return advisoryService.getAdvisory(cropType, season, diseaseName);
    }
}
