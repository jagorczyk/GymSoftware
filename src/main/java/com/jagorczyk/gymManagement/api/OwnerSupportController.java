package com.jagorczyk.gymManagement.api;

import com.jagorczyk.gymManagement.api.dto.SupportMessageDtos.CreateSupportThreadRequest;
import com.jagorczyk.gymManagement.api.dto.SupportMessageDtos.ReplySupportMessageRequest;
import com.jagorczyk.gymManagement.api.dto.SupportMessageDtos.SupportThreadDetail;
import com.jagorczyk.gymManagement.api.dto.SupportMessageDtos.SupportThreadSummary;
import com.jagorczyk.gymManagement.security.CustomUserPrincipal;
import com.jagorczyk.gymManagement.service.SupportMessageService;
import jakarta.validation.Valid;
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
@RequestMapping("/api/owner/gyms/{gymId}/support")
@PreAuthorize("hasRole('OWNER')")
public class OwnerSupportController {
    private final SupportMessageService supportMessageService;

    public OwnerSupportController(SupportMessageService supportMessageService) {
        this.supportMessageService = supportMessageService;
    }

    @GetMapping("/threads")
    public List<SupportThreadSummary> listThreads(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @PathVariable Long gymId
    ) {
        return supportMessageService.listStaffThreads(principal.getUser(), gymId);
    }

    @GetMapping("/unread-count")
    public java.util.Map<String, Integer> unreadCount(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @PathVariable Long gymId
    ) {
        return java.util.Map.of("count", supportMessageService.getStaffUnreadCount(principal.getUser(), gymId));
    }

    @GetMapping("/threads/{threadId}")
    public SupportThreadDetail getThread(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @PathVariable Long gymId,
            @PathVariable Long threadId
    ) {
        return supportMessageService.getStaffThread(principal.getUser(), gymId, threadId);
    }

    @PostMapping("/threads/{threadId}/messages")
    public SupportThreadDetail reply(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @PathVariable Long gymId,
            @PathVariable Long threadId,
            @Valid @RequestBody ReplySupportMessageRequest request
    ) {
        return supportMessageService.replyAsStaff(principal.getUser(), gymId, threadId, request);
    }

    @PostMapping("/threads/{threadId}/close")
    public SupportThreadDetail closeThread(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @PathVariable Long gymId,
            @PathVariable Long threadId
    ) {
        return supportMessageService.closeThread(principal.getUser(), gymId, threadId);
    }

    @PostMapping("/threads/{threadId}/reopen")
    public SupportThreadDetail reopenThread(
            @AuthenticationPrincipal CustomUserPrincipal principal,
            @PathVariable Long gymId,
            @PathVariable Long threadId
    ) {
        return supportMessageService.reopenThread(principal.getUser(), gymId, threadId);
    }
}
