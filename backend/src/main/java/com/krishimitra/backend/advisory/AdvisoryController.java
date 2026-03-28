package com.krishimitra.backend.advisory;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/advisory")
@CrossOrigin(origins = "*")
public class AdvisoryController {

    private final Map<String, AdvisoryResponse> advisoryMap = Map.of(
            "tomato", new AdvisoryResponse(
                    "tomato", "kharif",
                    List.of("Apply 75:25:25 NPK per acre split in 3 doses", "Use well-decomposed FYM before planting"),
                    List.of("Maintain 60-70% soil moisture", "Mulch to retain moisture and suppress weeds"),
                    List.of("Use yellow sticky traps for whiteflies", "Neem oil spray at 3ml/litre for early pest control"),
                    List.of("Avoid overhead irrigation during high humidity", "Scout for late blight after rains")
            ),
            "potato", new AdvisoryResponse(
                    "potato", "rabi",
                    List.of("Basal dose of 120:60:60 NPK", "Top dress nitrogen 30 days after planting"),
                    List.of("Irrigate lightly at tuber initiation", "Ensure drainage to avoid waterlogging"),
                    List.of("Drench with copper oxychloride on disease spots", "Use pheromone traps for cutworms"),
                    List.of("Watch for frost in winter mornings", "Delay irrigation if heavy rain forecast")
            ),
            "corn", new AdvisoryResponse(
                    "corn", "kharif",
                    List.of("Apply 120:60:40 NPK", "Add 2 tonnes of compost per acre"),
                    List.of("Irrigate at knee-high and tasseling stages", "Use drip for efficient water use"),
                    List.of("Monitor fall armyworm and apply recommended bio-pesticide", "Intercrop with legumes for soil health"),
                    List.of("Windy weather: stake plants if lodging risk", "Pause spraying if rain expected within 4 hours")
            )
    );

    @GetMapping
        public AdvisoryResponse getAdvisory(@RequestParam("cropType") String cropType,
                                                                                @RequestParam(value = "season", required = false, defaultValue = "kharif") String season,
                                                                                @RequestParam(value = "city", required = false, defaultValue = "") String city) {
        AdvisoryResponse response = advisoryMap.getOrDefault(cropType.toLowerCase(), advisoryMap.get("tomato"));
        return new AdvisoryResponse(response.getCropType(), season,
                response.getFertilizer(), response.getIrrigation(), response.getPestManagement(), response.getWeatherWarnings());
    }
}
