package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.GymDtos.PassView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.RenewPassRequest;
import com.jagorczyk.gymManagement.domain.Employee;
import com.jagorczyk.gymManagement.domain.EmployeePermission;
import com.jagorczyk.gymManagement.domain.Gym;
import com.jagorczyk.gymManagement.domain.GymPass;
import com.jagorczyk.gymManagement.domain.PassStatus;
import com.jagorczyk.gymManagement.domain.User;
import com.jagorczyk.gymManagement.repository.GymPassRepository;
import com.jagorczyk.gymManagement.repository.GymRepository;
import java.time.LocalDate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PassService {
    private final GymPassRepository gymPassRepository;
    private final GymRepository gymRepository;
    private final EmployeePermissionService employeePermissionService;
    private final AuditLogService auditLogService;
    private final GuestPresenceService guestPresenceService;

    public PassService(
            GymPassRepository gymPassRepository,
            GymRepository gymRepository,
            EmployeePermissionService employeePermissionService,
            AuditLogService auditLogService,
            GuestPresenceService guestPresenceService
    ) {
        this.gymPassRepository = gymPassRepository;
        this.gymRepository = gymRepository;
        this.employeePermissionService = employeePermissionService;
        this.auditLogService = auditLogService;
        this.guestPresenceService = guestPresenceService;
    }

    @Transactional
    public PassView renewPassForEmployee(User currentUser, Long gymId, Long passId, RenewPassRequest request) {
        Employee employee = employeePermissionService.requireEmployee(currentUser, gymId);
        employeePermissionService.requirePermission(currentUser, gymId, EmployeePermission.SELL_PASSES);
        return renewPass(employee.getGym(), currentUser, gymId, passId, request);
    }

    @Transactional
    public PassView renewPassForOwner(Long ownerUserId, Long gymId, Long passId, RenewPassRequest request) {
        Gym gym = requireOwnerGym(ownerUserId, gymId);
        User owner = gym.getOwnerUser();
        return renewPass(gym, owner, gymId, passId, request);
    }

    @Transactional
    public PassView cancelPassForEmployee(User currentUser, Long gymId, Long passId) {
        Employee employee = employeePermissionService.requireEmployee(currentUser, gymId);
        employeePermissionService.requirePermission(currentUser, gymId, EmployeePermission.SELL_PASSES);
        return cancelPass(employee.getGym(), currentUser, gymId, passId);
    }

    @Transactional
    public PassView cancelPassForOwner(Long ownerUserId, Long gymId, Long passId) {
        Gym gym = requireOwnerGym(ownerUserId, gymId);
        return cancelPass(gym, gym.getOwnerUser(), gymId, passId);
    }

    @Transactional
    public int expirePassesPastEndDate() {
        LocalDate today = LocalDate.now();
        var toExpire = gymPassRepository.findByStatusAndEndDateBefore(PassStatus.ACTIVE, today);
        for (GymPass pass : toExpire) {
            pass.setStatus(PassStatus.EXPIRED);
            gymPassRepository.save(pass);
            auditLogService.log(pass.getGym(), null, "PASS_EXPIRED", "passId=" + pass.getId());
        }
        return toExpire.size();
    }

    private PassView renewPass(Gym gym, User actor, Long gymId, Long passId, RenewPassRequest request) {
        GymPass pass = gymPassRepository.findById(passId)
                .filter(p -> p.getGym().getId().equals(gymId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono karnetu w tej siłowni."));
        if (pass.getStatus() != PassStatus.ACTIVE && pass.getStatus() != PassStatus.EXPIRED) {
            throw new IllegalArgumentException("Można przedłużyć tylko aktywny lub wygasły karnet.");
        }
        if (request.endDate().isBefore(pass.getStartDate())) {
            throw new IllegalArgumentException("Data końca nie może być wcześniejsza niż data startu karnetu.");
        }
        pass.setEndDate(request.endDate());
        pass.setPrice(request.price());
        pass.setStatus(PassStatus.ACTIVE);
        GymPass saved = gymPassRepository.save(pass);
        auditLogService.log(gym, actor, "PASS_RENEWED", "passId=" + saved.getId() + ",endDate=" + request.endDate());
        return guestPresenceService.toPassView(saved);
    }

    private PassView cancelPass(Gym gym, User actor, Long gymId, Long passId) {
        GymPass pass = gymPassRepository.findById(passId)
                .filter(p -> p.getGym().getId().equals(gymId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono karnetu w tej siłowni."));
        if (pass.getStatus() == PassStatus.CANCELLED) {
            throw new IllegalArgumentException("Karnet jest już anulowany.");
        }
        pass.setStatus(PassStatus.CANCELLED);
        GymPass saved = gymPassRepository.save(pass);
        auditLogService.log(gym, actor, "PASS_CANCELLED", "passId=" + saved.getId());
        return guestPresenceService.toPassView(saved);
    }

    private Gym requireOwnerGym(Long ownerUserId, Long gymId) {
        return gymRepository.findById(gymId)
                .filter(g -> g.getOwnerUser().getId().equals(ownerUserId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono siłowni lub brak uprawnień właściciela."));
    }
}
