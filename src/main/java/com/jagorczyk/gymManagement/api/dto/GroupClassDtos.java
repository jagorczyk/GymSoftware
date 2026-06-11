package com.jagorczyk.gymManagement.api.dto;

import java.time.LocalDateTime;

public class GroupClassDtos {

    public record GroupClassView(
            Long id,
            Long instructorId,
            String instructorName,
            String name,
            String description,
            LocalDateTime startTime,
            LocalDateTime endTime,
            Integer capacity,
            long activeReservations
    ) {}

    public record ClassReservationView(
            Long id,
            Long classId,
            Long guestId,
            String guestFirstName,
            String guestLastName,
            String guestEmail,
            String status,
            LocalDateTime reservedAt
    ) {}

    public record CreateGroupClassRequest(
            Long instructorId,
            String name,
            String description,
            LocalDateTime startTime,
            LocalDateTime endTime,
            Integer capacity
    ) {}

    public record UpdateGroupClassRequest(
            Long instructorId,
            String name,
            String description,
            LocalDateTime startTime,
            LocalDateTime endTime,
            Integer capacity
    ) {}

    public record UpdateAttendanceRequest(
            String status
    ) {}
}
