package com.krishimitra.backend.advisory;

import com.krishimitra.backend.detection.DetectionService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class AdvisoryService {

    private final Map<String, AdvisoryResponse> advisoryMap = Map.of(
            "tomato", new AdvisoryResponse(
                    "tomato", "kharif",
                    List.of("Apply 75:25:25 NPK per acre in split doses", "Incorporate well-decomposed FYM before transplanting"),
                    List.of("Maintain 60-70% soil moisture", "Use mulching to reduce moisture loss"),
                    List.of("Use yellow sticky traps for whiteflies", "Use neem-based spray at early infestation"),
                    List.of("Avoid overhead irrigation during humid days", "Increase scouting after continuous rain")
            ),
            "potato", new AdvisoryResponse(
                    "potato", "rabi",
                    List.of("Use 120:60:60 NPK basal nutrition", "Top dress nitrogen around 30 DAP"),
                    List.of("Irrigate lightly at tuber initiation", "Avoid standing water to prevent rot"),
                    List.of("Use copper fungicide at first lesion signs", "Use pheromone traps for cutworm monitoring"),
                    List.of("Monitor frost in cold mornings", "Adjust irrigation after heavy rainfall")
            ),
            "corn", new AdvisoryResponse(
                    "corn", "kharif",
                    List.of("Apply 120:60:40 NPK with soil test corrections", "Add compost to improve structure"),
                    List.of("Prioritize irrigation at knee-high and tasseling stage", "Prefer drip/furrow efficiency methods"),
                    List.of("Monitor for fall armyworm weekly", "Use recommended bio-control in early stage"),
                    List.of("Watch for lodging in storm periods", "Avoid spraying if rain expected in 4 hours")
            )
    );

    public AdvisoryResponse getAdvisory(String cropType, String season, String diseaseName) {
        String normalizedCrop = normalize(cropType, "tomato");
        String normalizedSeason = normalize(season, "kharif");
        String normalizedDisease = normalize(diseaseName, null);

        AdvisoryResponse base = advisoryMap.getOrDefault(normalizedCrop, advisoryMap.get("tomato"));

        List<String> diseaseAdvice = normalizedDisease == null
                ? List.of()
                : DetectionService.getDiseaseCareChecklist(normalizedDisease);

        return new AdvisoryResponse(
                base.getCropType(),
                normalizedSeason,
                normalizedDisease,
                base.getFertilizer(),
                base.getIrrigation(),
                base.getPestManagement(),
                base.getWeatherWarnings(),
                diseaseAdvice
        );
    }

    private String normalize(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }
}
