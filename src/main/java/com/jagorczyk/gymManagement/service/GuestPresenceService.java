package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.GymDtos.GuestView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.LiveGuestView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.PassView;
import com.jagorczyk.gymManagement.domain.Guest;
import com.jagorczyk.gymManagement.domain.GuestCheckIn;
import com.jagorczyk.gymManagement.domain.GymPass;
import com.jagorczyk.gymManagement.domain.LockerAssignment;
import com.jagorczyk.gymManagement.domain.PassStatus;
import com.jagorczyk.gymManagement.repository.GuestCheckInRepository;
import com.jagorczyk.gymManagement.repository.GymPassRepository;
import com.jagorczyk.gymManagement.repository.LockerAssignmentRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class GuestPresenceService {
    private final GuestCheckInRepository guestCheckInRepository;
    private final LockerAssignmentRepository lockerAssignmentRepository;
    private final GymPassRepository gymPassRepository;

    public GuestPresenceService(
            GuestCheckInRepository guestCheckInRepository,
            LockerAssignmentRepository lockerAssignmentRepository,
            GymPassRepository gymPassRepository
    ) {
        this.guestCheckInRepository = guestCheckInRepository;
        this.lockerAssignmentRepository = lockerAssignmentRepository;
        this.gymPassRepository = gymPassRepository;
    }

    public Set<Long> activeCheckInGuestIds(Long gymId) {
        return guestCheckInRepository.findByGymIdAndCheckedOutAtIsNull(gymId).stream()
                .map(c -> c.getGuest().getId())
                .collect(Collectors.toSet());
    }

    public Set<Long> activeLockerGuestIds(Long gymId) {
        return lockerAssignmentRepository.findByLockerGymIdAndReturnedAtIsNull(gymId).stream()
                .map(a -> a.getGuest().getId())
                .collect(Collectors.toSet());
    }

    public boolean isCheckedIn(Long guestId) {
        return guestCheckInRepository.existsByGuestIdAndCheckedOutAtIsNull(guestId);
    }

    public boolean hasActiveLocker(Long guestId) {
        return !lockerAssignmentRepository.findByGuestIdAndReturnedAtIsNull(guestId).isEmpty();
    }

    public List<LiveGuestView> presentGuests(Long gymId) {
        return guestCheckInRepository.findByGymIdAndCheckedOutAtIsNull(gymId).stream()
                .map(c -> new LiveGuestView(
                        c.getGuest().getId(),
                        c.getGuest().getFirstName(),
                        c.getGuest().getLastName(),
                        c.getGuest().getEmail()))
                .distinct()
                .toList();
    }

    public GuestView toGuestView(
            Guest guest,
            List<GymPass> gymPasses,
            Set<Long> checkedInGuestIds,
            Set<Long> lockerGuestIds
    ) {
        Optional<GymPass> activePass = gymPasses.stream()
                .filter(p -> p.getGuest().getId().equals(guest.getId()) && isPassUsable(p))
                .findFirst();
        boolean isPresent = checkedInGuestIds.contains(guest.getId());
        boolean hasLocker = lockerGuestIds.contains(guest.getId());
        return new GuestView(
                guest.getId(),
                guest.getFirstName(),
                guest.getLastName(),
                guest.getEmail(),
                guest.getPhone(),
                guest.getNotes(),
                activePass.isPresent(),
                isPresent,
                hasLocker,
                activePass.map(GymPass::getEndDate).orElse(null),
                guest.getAvatarUrl()
        );
    }

    public PassView toPassView(GymPass pass) {
        Guest guest = pass.getGuest();
        return new PassView(
                pass.getId(),
                guest.getId(),
                pass.getPassType(),
                pass.getStatus(),
                pass.getStartDate(),
                pass.getEndDate(),
                pass.getPrice(),
                guest.getFirstName(),
                guest.getLastName(),
                pass.getMaxEntries(),
                pass.getRemainingEntries()
        );
    }

    public boolean isPassUsable(GymPass pass) {
        return isPassUsable(pass, LocalDate.now());
    }

    public boolean isPassUsable(GymPass pass, LocalDate today) {
        if (pass.getStatus() != PassStatus.ACTIVE) {
            return false;
        }
        if (today.isBefore(pass.getStartDate()) || today.isAfter(pass.getEndDate())) {
            return false;
        }
        return pass.getRemainingEntries() == null || pass.getRemainingEntries() > 0;
    }

    public void consumeEntry(GymPass pass) {
        if (pass.getRemainingEntries() == null) {
            return;
        }
        int remaining = pass.getRemainingEntries() - 1;
        pass.setRemainingEntries(remaining);
        if (remaining <= 0) {
            pass.setStatus(PassStatus.EXPIRED);
        }
        gymPassRepository.save(pass);
    }

    public void applyEntryLimits(GymPass pass, Integer maxEntries) {
        pass.setMaxEntries(maxEntries);
        pass.setRemainingEntries(maxEntries);
    }

    public Optional<GymPass> findActivePass(List<GymPass> passes, Long guestId) {
        return passes.stream()
                .filter(p -> p.getGuest().getId().equals(guestId) && isPassUsable(p))
                .findFirst();
    }

    public Optional<GymPass> findActivePass(List<GymPass> passes, Long guestId, LocalDate today) {
        return passes.stream()
                .filter(p -> p.getGuest().getId().equals(guestId) && isPassUsable(p, today))
                .findFirst();
    }

    public List<LockerAssignment> activeAssignments(Long gymId) {
        return lockerAssignmentRepository.findByLockerGymIdAndReturnedAtIsNull(gymId);
    }
}
