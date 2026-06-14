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
        campaign.setStatus("SENDING");
        EmailCampaign saved = emailCampaignRepository.save(campaign);

        List<Guest> targets;
        if ("ACTIVE_PASSES".equalsIgnoreCase(request.targetSegment())) {
            targets = gymPassRepository.findByGymIdAndStatus(gymId, PassStatus.ACTIVE)
                    .stream()
                    .map(GymPass::getGuest)
                    .filter(g -> g.getEmail() != null && !g.getEmail().isBlank())
                    .distinct()
                    .toList();
        } else {
            // ALL_GUESTS
            targets = guestRepository.findByGymId(gymId)
                    .stream()
                    .filter(g -> g.getEmail() != null && !g.getEmail().isBlank())
                    .toList();
        }

        for (Guest guest : targets) {
            emailService.sendCampaignEmail(guest.getEmail(), request.subject(), request.body());
        }

        saved.setStatus("SENT");
        saved.setSentAt(LocalDateTime.now());
        emailCampaignRepository.save(saved);

        return mapToView(saved);
    }

    private EmailCampaignView mapToView(EmailCampaign campaign) {
        return new EmailCampaignView(
                campaign.getId(),
                campaign.getSubject(),
                campaign.getBody(),
                campaign.getTargetSegment(),
                campaign.getStatus(),
                campaign.getCreatedAt(),
                campaign.getSentAt()
        );
    }
}
