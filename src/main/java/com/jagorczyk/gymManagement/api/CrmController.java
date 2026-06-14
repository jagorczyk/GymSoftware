package com.jagorczyk.gymManagement.api;

import com.jagorczyk.gymManagement.api.dto.GymDtos.CreateEmailCampaignRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.EmailCampaignView;
import com.jagorczyk.gymManagement.service.CrmService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/owner/gyms/{gymId}/crm")
@PreAuthorize("hasRole('OWNER')")
public class CrmController {

    private final CrmService crmService;

    public CrmController(CrmService crmService) {
        this.crmService = crmService;
    }

    @GetMapping("/campaigns")
    public List<EmailCampaignView> getCampaigns(@PathVariable Long gymId) {
        return crmService.getCampaigns(gymId);
    }

    @PostMapping("/campaigns")
    public EmailCampaignView createCampaign(
            @PathVariable Long gymId,
            @Valid @RequestBody CreateEmailCampaignRequest request) {
        return crmService.createAndSendCampaign(gymId, request);
    }
}
