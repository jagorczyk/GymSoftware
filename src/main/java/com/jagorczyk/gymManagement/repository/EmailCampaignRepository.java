package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.EmailCampaign;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface EmailCampaignRepository extends JpaRepository<EmailCampaign, Long> {
    List<EmailCampaign> findByGymIdOrderByCreatedAtDesc(Long gymId);
    List<EmailCampaign> findByStatusAndScheduledAtLessThanEqual(String status, LocalDateTime time);
}
