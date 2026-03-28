package com.krishimitra.backend.market;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/market")
@CrossOrigin(origins = "*")
public class MarketController {

    private final Map<String, MarketResponse> seeds = Map.of(
            "tomato", new MarketResponse("tomato", "pune", 2200, List.of(
                    new MarketPoint("2024-03-01", 2100),
                    new MarketPoint("2024-03-08", 2150),
                    new MarketPoint("2024-03-15", 2200),
                    new MarketPoint("2024-03-22", 2250)
            )),
            "potato", new MarketResponse("potato", "nashik", 1800, List.of(
                    new MarketPoint("2024-03-01", 1700),
                    new MarketPoint("2024-03-08", 1720),
                    new MarketPoint("2024-03-15", 1780),
                    new MarketPoint("2024-03-22", 1800)
            )),
            "corn", new MarketResponse("corn", "nagpur", 1400, List.of(
                    new MarketPoint("2024-03-01", 1300),
                    new MarketPoint("2024-03-08", 1350),
                    new MarketPoint("2024-03-15", 1380),
                    new MarketPoint("2024-03-22", 1400)
            ))
    );

    @GetMapping
        public MarketResponse getMarket(@RequestParam("cropType") String cropType,
                                                                        @RequestParam(value = "city", required = false, defaultValue = "pune") String city) {
        return seeds.getOrDefault(cropType.toLowerCase(), seeds.get("tomato"));
    }
}
