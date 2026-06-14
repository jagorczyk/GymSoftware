package com.jagorczyk.gymManagement.api;

import com.jagorczyk.gymManagement.api.dto.ClientPortalDtos.ClientDashboardView;
import com.jagorczyk.gymManagement.api.dto.ClientPortalDtos.ClientGymView;
import com.jagorczyk.gymManagement.api.dto.ClientPortalDtos.ClientPassView;
import com.jagorczyk.gymManagement.api.dto.ClientPortalDtos.ClientPassTypeView;
import com.jagorczyk.gymManagement.api.dto.ClientPortalDtos.JoinGymRequest;
import com.jagorczyk.gymManagement.api.dto.ClientPortalDtos.PurchasePassRequest;
import com.jagorczyk.gymManagement.api.dto.ClientPortalDtos.RateClassRequest;
import com.jagorczyk.gymManagement.api.dto.ClientPortalDtos.FreezePassRequest;
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
    private final com.jagorczyk.gymManagement.security.JwtService jwtService;

    public ClientPortalController(
            ClientPortalService clientPortalService,
            com.jagorczyk.gymManagement.security.JwtService jwtService
    ) {
        this.clientPortalService = clientPortalService;
        this.jwtService = jwtService;
    }

    @GetMapping("/checkin-qr-token")
    public java.util.Map<String, String> getCheckInQrToken(@AuthenticationPrincipal CustomUserPrincipal principal) {
        String token = jwtService.generateCheckInToken(principal);
        return java.util.Map.of("qrToken", token);
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

    @PostMapping("/gyms/{gymId}/simulate-payment")
    public void simulatePayment(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @PathVariable Long gymId,
            @RequestBody PurchasePassRequest request
    ) {
        clientPortalService.activatePassFromStripe(principal.getUserId(), gymId, request.passTypeId());
    }

    @GetMapping("/gyms/{gymId}/classes")
    public List<com.jagorczyk.gymManagement.api.dto.GroupClassDtos.GroupClassView> getClasses(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @PathVariable Long gymId,
            @org.springframework.web.bind.annotation.RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime from,
            @org.springframework.web.bind.annotation.RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime to
    ) {
        return clientPortalService.getClasses(principal.getUserId(), gymId, from, to);
    }

    @PostMapping("/gyms/{gymId}/classes/{classId}/book")
    public void bookClass(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @PathVariable Long gymId,
            @PathVariable Long classId
    ) {
        clientPortalService.bookClass(principal.getUserId(), gymId, classId);
    }

    @PostMapping("/gyms/{gymId}/classes/{classId}/cancel")
    public void cancelBooking(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @PathVariable Long gymId,
            @PathVariable Long classId
    ) {
        clientPortalService.cancelBooking(principal.getUserId(), gymId, classId);
    }

    @PostMapping("/gyms/{gymId}/classes/{classId}/rate")
    public void rateClass(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @PathVariable Long gymId,
            @PathVariable Long classId,
            @RequestBody RateClassRequest request
    ) {
        clientPortalService.rateClass(principal.getUserId(), gymId, classId, request.rating(), request.comment());
    }

    @PostMapping("/gyms/{gymId}/passes/{passId}/freeze")
    public void freezePass(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @PathVariable Long gymId,
            @PathVariable Long passId,
            @RequestBody FreezePassRequest request
    ) {
        clientPortalService.freezePass(principal.getUserId(), gymId, passId, request.startDate(), request.endDate());
    }

    @GetMapping("/gyms/{gymId}/passes/{passId}/invoice")
    public org.springframework.http.ResponseEntity<byte[]> downloadInvoice(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @PathVariable Long gymId,
            @PathVariable Long passId
    ) {
        byte[] pdfBytes = clientPortalService.getInvoicePdf(principal.getUserId(), gymId, passId);
        
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        headers.setContentDisposition(org.springframework.http.ContentDisposition.builder("inline")
                .filename("invoice-" + passId + ".pdf")
                .build());
                
        return new org.springframework.http.ResponseEntity<>(pdfBytes, headers, org.springframework.http.HttpStatus.OK);
    }

    @GetMapping("/dashboard/global-stats")
    public java.util.Map<String, Integer> getGlobalStats(@AuthenticationPrincipal CustomUserPrincipal principal) {
        return clientPortalService.getGlobalStats(principal.getUserId());
    }

    @GetMapping("/gyms/{gymId}/trainers")
    public List<com.jagorczyk.gymManagement.api.dto.ClientPortalDtos.TrainerProfileView> getTrainers(
            @PathVariable Long gymId
    ) {
        return clientPortalService.getTrainers(gymId);
    }

    @PostMapping("/gyms/{gymId}/trainers/{trainerId}/book")
    public void bookPersonalTraining(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @PathVariable Long gymId,
            @PathVariable Long trainerId,
            @RequestBody com.jagorczyk.gymManagement.api.dto.ClientPortalDtos.BookTrainingRequest request
    ) {
        clientPortalService.bookPersonalTraining(principal.getUserId(), gymId, trainerId, request);
    }

    @GetMapping("/gyms/{gymId}/trainers/{trainerId}/available-slots")
    public List<com.jagorczyk.gymManagement.api.dto.ClientPortalDtos.AvailableSlotView> getAvailableSlots(
            @PathVariable Long gymId,
            @PathVariable Long trainerId,
            @org.springframework.web.bind.annotation.RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate date
    ) {
        return clientPortalService.getAvailableSlots(gymId, trainerId, date);
    }

    @GetMapping("/trainings")
    public List<com.jagorczyk.gymManagement.api.dto.ClientPortalDtos.PersonalTrainingView> getTrainings(
            @AuthenticationPrincipal CustomUserPrincipal principal
    ) {
        return clientPortalService.getTrainings(principal.getUserId());
    }

    @GetMapping("/gyms/{gymId}/trainers/{trainerId}/schedule")
    public List<com.jagorczyk.gymManagement.api.dto.ClientPortalDtos.TrainerScheduleDayView> getTrainerSchedule(
            @PathVariable Long gymId,
            @PathVariable Long trainerId
    ) {
        return clientPortalService.getFullSchedule(gymId, trainerId);
    }
}
