package com.krishimitra.backend.market;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MarketPriceAlertRepository extends JpaRepository<MarketPriceAlert, Long> {
    List<MarketPriceAlert> findTop50ByFarmerEmailOrderByCreatedAtDesc(String farmerEmail);

    Optional<MarketPriceAlert> findByIdAndFarmerEmail(Long id, String farmerEmail);
}
