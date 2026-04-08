package com.krishimitra.backend.detection;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DetectionReportRepository extends JpaRepository<DetectionReport, Long> {
	List<DetectionReport> findTop50ByOrderByCreatedAtDesc();
	List<DetectionReport> findTop50ByFarmerEmailOrderByCreatedAtDesc(String farmerEmail);
}
