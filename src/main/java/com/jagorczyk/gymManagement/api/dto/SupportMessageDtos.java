package com.jagorczyk.gymManagement.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class SupportMessageDtos {
    private SupportMessageDtos() {}

    public record CreateSupportThreadRequest(
            @NotBlank @Size(max = 255) String subject,
            @NotBlank @Size(max = 5000) String body
    ) {}

    public record ReplySupportMessageRequest(
            @NotBlank @Size(max = 5000) String body
    ) {}

    public record SupportMessageView(
            Long id,
            Long senderUserId,
            String senderName,
            String senderSide,
            String body,
            String createdAt
    ) {}

    public record SupportThreadSummary(
            Long id,
            Long gymId,
            String gymName,
            Long guestId,
            String guestName,
            String guestEmail,
            String subject,
            String status,
            String lastMessagePreview,
            String updatedAt,
            int unreadCount
    ) {}

    public record SupportThreadDetail(
            Long id,
            Long gymId,
            String gymName,
            Long guestId,
            String guestName,
            String guestEmail,
            String subject,
            String status,
            String createdAt,
            String updatedAt,
            List<SupportMessageView> messages
    ) {}
}
