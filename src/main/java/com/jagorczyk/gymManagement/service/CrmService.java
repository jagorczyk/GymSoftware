package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.GymDtos.CreateEmailCampaignRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.EmailCampaignView;
import com.jagorczyk.gymManagement.domain.EmailCampaign;
import com.jagorczyk.gymManagement.domain.Guest;
import com.jagorczyk.gymManagement.domain.GymPass;
import com.jagorczyk.gymManagement.domain.PassStatus;
import com.jagorczyk.gymManagement.repository.EmailCampaignRepository;
import com.jagorczyk.gymManagement.repository.GuestRepository;
import com.jagorczyk.gymManagement.repository.GymPassRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class CrmService {

    private final EmailCampaignRepository emailCampaignRepository;
    private final GuestRepository guestRepository;
    private final GymPassRepository gymPassRepository;
    private final EmailService emailService;

    public CrmService(
            EmailCampaignRepository emailCampaignRepository,
            GuestRepository guestRepository,
            GymPassRepository gymPassRepository,
            EmailService emailService) {
        this.emailCampaignRepository = emailCampaignRepository;
        this.guestRepository = guestRepository;
        this.gymPassRepository = gymPassRepository;
        this.emailService = emailService;
    }

    public List<EmailCampaignView> getCampaigns(Long gymId) {
        return emailCampaignRepository.findByGymIdOrderByCreatedAtDesc(gymId)
                .stream()
                .map(this::mapToView)
                .collect(Collectors.toList());
    }

    public EmailCampaignView createAndSendCampaign(Long gymId, CreateEmailCampaignRequest request) {
        EmailCampaign campaign = new EmailCampaign();
        campaign.setGymId(gymId);
        campaign.setSubject(request.subject());
        campaign.setBody(request.body());
        campaign.setTargetSegment(request.targetSegment());

        if (request.scheduledAt() != null && request.scheduledAt().isAfter(LocalDateTime.now())) {
            campaign.setStatus("SCHEDULED");
            campaign.setScheduledAt(request.scheduledAt());
            EmailCampaign saved = emailCampaignRepository.save(campaign);
            return mapToView(saved);
        }

        campaign.setStatus("SENDING");
        EmailCampaign saved = emailCampaignRepository.save(campaign);

        sendCampaignToTargets(saved);

        saved.setStatus("SENT");
        saved.setSentAt(LocalDateTime.now());
        emailCampaignRepository.save(saved);

        return mapToView(saved);
    }

    private void sendCampaignToTargets(EmailCampaign campaign) {
        List<Guest> targets;
        if ("ACTIVE_PASSES".equalsIgnoreCase(campaign.getTargetSegment())) {
            targets = gymPassRepository.findByGymIdAndStatus(campaign.getGymId(), PassStatus.ACTIVE)
                    .stream()
                    .map(GymPass::getGuest)
                    .filter(g -> g.getEmail() != null && !g.getEmail().isBlank())
                    .distinct()
                    .toList();
        } else {
            // ALL_GUESTS
            targets = guestRepository.findByGymId(campaign.getGymId())
                    .stream()
                    .filter(g -> g.getEmail() != null && !g.getEmail().isBlank())
                    .toList();
        }

        for (Guest guest : targets) {
            String personalizedBody = campaign.getBody();
            if (personalizedBody != null) {
                personalizedBody = personalizedBody
                        .replace("{{imie}}", guest.getFirstName() != null ? guest.getFirstName() : "")
                        .replace("{{nazwisko}}", guest.getLastName() != null ? guest.getLastName() : "")
                        .replace("{{email}}", guest.getEmail() != null ? guest.getEmail() : "")
                        .replace("{{telefon}}", guest.getPhone() != null ? guest.getPhone() : "");
            }
            emailService.sendCampaignEmail(guest.getEmail(), campaign.getSubject(), personalizedBody);
        }
    }

    @org.springframework.scheduling.annotation.Scheduled(cron = "0 * * * * *")
    public void processScheduledCampaigns() {
        List<EmailCampaign> scheduledCampaigns = emailCampaignRepository.findByStatusAndScheduledAtLessThanEqual("SCHEDULED", LocalDateTime.now());
        for (EmailCampaign campaign : scheduledCampaigns) {
            campaign.setStatus("SENDING");
            emailCampaignRepository.save(campaign);
            
            sendCampaignToTargets(campaign);
            
            campaign.setStatus("SENT");
            campaign.setSentAt(LocalDateTime.now());
            emailCampaignRepository.save(campaign);
        }
    }

    private EmailCampaignView mapToView(EmailCampaign campaign) {
        return new EmailCampaignView(
                campaign.getId(),
                campaign.getSubject(),
                campaign.getBody(),
                campaign.getTargetSegment(),
                campaign.getStatus(),
                campaign.getCreatedAt(),
                campaign.getSentAt(),
                campaign.getScheduledAt()
        );
    }
}
