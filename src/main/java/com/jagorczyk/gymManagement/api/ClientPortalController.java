package com.jagorczyk.gymManagement.api;

import com.jagorczyk.gymManagement.api.dto.ClientPortalDtos.ClientDashboardView;
import com.jagorczyk.gymManagement.api.dto.ClientPortalDtos.ClientGymView;
import com.jagorczyk.gymManagement.api.dto.ClientPortalDtos.ClientPassView;
import com.jagorczyk.gymManagement.api.dto.ClientPortalDtos.ClientPassTypeView;
import com.jagorczyk.gymManagement.api.dto.ClientPortalDtos.JoinGymRequest;
import com.jagorczyk.gymManagement.api.dto.ClientPortalDtos.PurchasePassRequest;
import com.jagorczyk.gymManagement.security.CustomUserPrincipal;
import com.jagorczyk.gymManagement.service.ClientPortalService;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/client")
@PreAuthorize("hasRole('GUEST')")
public class ClientPortalController {

    private final ClientPortalService clientPortalService;

    public ClientPortalController(ClientPortalService clientPortalService) {
        this.clientPortalService = clientPortalService;
    }

    @GetMapping("/gyms")
    public List<ClientGymView> getMyGyms(@AuthenticationPrincipal CustomUserPrincipal principal) {
        return clientPortalService.getMyGyms(principal.getUserId());
    }
    
    @GetMapping("/gyms/all")
    public List<ClientGymView> getAllGyms() {
        return clientPortalService.getAllGyms();
    }

    @PostMapping("/gyms/join")
    public ClientGymView joinGym(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @RequestBody JoinGymRequest request
    ) {
        return clientPortalService.joinGym(principal.getUserId(), request);
    }

    @GetMapping("/gyms/{gymId}/dashboard")
    public ClientDashboardView getDashboard(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @PathVariable Long gymId
    ) {
        return clientPortalService.getDashboard(principal.getUserId(), gymId);
    }

    @GetMapping("/gyms/{gymId}/pass-types")
    public List<ClientPassTypeView> getPassTypes(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @PathVariable Long gymId
    ) {
        return clientPortalService.getPassTypes(gymId);
    }

    @PostMapping("/gyms/{gymId}/purchase-pass")
    public com.jagorczyk.gymManagement.api.dto.ClientPortalDtos.PurchasePassResponse purchasePass(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @PathVariable Long gymId,
            @RequestBody PurchasePassRequest request
    ) {
        return clientPortalService.purchasePass(principal.getUserId(), gymId, request);
    }
}
