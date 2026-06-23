package com.jagorczyk.gymManagement.api;

import com.jagorczyk.gymManagement.api.dto.SupportMessageDtos.ReplySupportMessageRequest;
import com.jagorczyk.gymManagement.api.dto.SupportMessageDtos.SupportThreadDetail;
import com.jagorczyk.gymManagement.api.dto.SupportMessageDtos.SupportThreadSummary;
import com.jagorczyk.gymManagement.service.CurrentUserService;
import com.jagorczyk.gymManagement.service.SupportMessageService;
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
@RequestMapping("/api/employee/gyms/{gymId}/support")
@PreAuthorize("hasRole('EMPLOYEE')")
public class EmployeeSupportController {
    private final SupportMessageService supportMessageService;
    private final CurrentUserService currentUserService;

    public EmployeeSupportController(
            SupportMessageService supportMessageService,
            CurrentUserService currentUserService
    ) {
        this.supportMessageService = supportMessageService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/threads")
    public List<SupportThreadSummary> listThreads(@PathVariable Long gymId) {
        return supportMessageService.listStaffThreads(currentUserService.getCurrentUser(), gymId);
    }

    @GetMapping("/threads/{threadId}")
    public SupportThreadDetail getThread(@PathVariable Long gymId, @PathVariable Long threadId) {
        return supportMessageService.getStaffThread(currentUserService.getCurrentUser(), gymId, threadId);
    }

    @PostMapping("/threads/{threadId}/messages")
    public SupportThreadDetail reply(
            @PathVariable Long gymId,
            @PathVariable Long threadId,
            @Valid @RequestBody ReplySupportMessageRequest request
    ) {
        return supportMessageService.replyAsStaff(currentUserService.getCurrentUser(), gymId, threadId, request);
    }

    @PostMapping("/threads/{threadId}/close")
    public SupportThreadDetail closeThread(@PathVariable Long gymId, @PathVariable Long threadId) {
        return supportMessageService.closeThread(currentUserService.getCurrentUser(), gymId, threadId);
    }

    @PostMapping("/threads/{threadId}/reopen")
    public SupportThreadDetail reopenThread(@PathVariable Long gymId, @PathVariable Long threadId) {
        return supportMessageService.reopenThread(currentUserService.getCurrentUser(), gymId, threadId);
    }
}
