package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.GymDtos.AssignLockerRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.CreateGuestRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.CreateLockerRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.CreatePassTypeRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.EmployeeGymView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.EmployeeLiveOverview;
import com.jagorczyk.gymManagement.api.dto.GymDtos.ExpiringPassView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.GuestDetailView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.GuestView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.LiveLockerView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.LockerView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.PassTypeView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.PassView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.SellPassRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.UpdateGuestRequest;
import com.jagorczyk.gymManagement.domain.Employee;
import com.jagorczyk.gymManagement.domain.EmployeePermission;
import com.jagorczyk.gymManagement.domain.Guest;
import com.jagorczyk.gymManagement.domain.GuestCheckIn;
import com.jagorczyk.gymManagement.domain.GymPass;
import com.jagorczyk.gymManagement.domain.Locker;
import com.jagorczyk.gymManagement.domain.LockerAssignment;
import com.jagorczyk.gymManagement.domain.LockerStatus;
import com.jagorczyk.gymManagement.domain.PassStatus;
import com.jagorczyk.gymManagement.domain.PassType;
import com.jagorczyk.gymManagement.domain.User;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import com.jagorczyk.gymManagement.repository.EmployeeRepository;
import com.jagorczyk.gymManagement.repository.GuestCheckInRepository;
import com.jagorczyk.gymManagement.repository.GuestRepository;
import com.jagorczyk.gymManagement.repository.GymPassRepository;
import com.jagorczyk.gymManagement.repository.LockerAssignmentRepository;
import com.jagorczyk.gymManagement.repository.LockerRepository;
import com.jagorczyk.gymManagement.repository.PassTypeRepository;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmployeeService {
    private final EmployeeRepository employeeRepository;
    private final EmployeePermissionService employeePermissionService;
    private final GuestRepository guestRepository;
    private final GymPassRepository gymPassRepository;
    private final LockerRepository lockerRepository;
    private final LockerAssignmentRepository lockerAssignmentRepository;
    private final AuditLogService auditLogService;
    private final PassTypeRepository passTypeRepository;
    private final GuestCheckInRepository guestCheckInRepository;
    private final GuestPresenceService guestPresenceService;
    private final com.jagorczyk.gymManagement.repository.PassFreezeRepository passFreezeRepository;
    private final com.jagorczyk.gymManagement.repository.ProductSaleRepository productSaleRepository;

    public EmployeeService(
            EmployeeRepository employeeRepository,
            EmployeePermissionService employeePermissionService,
            GuestRepository guestRepository,
            GymPassRepository gymPassRepository,
            LockerRepository lockerRepository,
            LockerAssignmentRepository lockerAssignmentRepository,
            AuditLogService auditLogService,
            PassTypeRepository passTypeRepository,
            GuestCheckInRepository guestCheckInRepository,
            GuestPresenceService guestPresenceService,
            com.jagorczyk.gymManagement.repository.PassFreezeRepository passFreezeRepository,
            com.jagorczyk.gymManagement.repository.ProductSaleRepository productSaleRepository
    ) {
        this.employeeRepository = employeeRepository;
        this.employeePermissionService = employeePermissionService;
        this.guestRepository = guestRepository;
        this.gymPassRepository = gymPassRepository;
        this.lockerRepository = lockerRepository;
        this.lockerAssignmentRepository = lockerAssignmentRepository;
        this.auditLogService = auditLogService;
        this.passTypeRepository = passTypeRepository;
        this.guestCheckInRepository = guestCheckInRepository;
        this.guestPresenceService = guestPresenceService;
        this.passFreezeRepository = passFreezeRepository;
        this.productSaleRepository = productSaleRepository;
    }

    @Transactional
    public PassView sellPass(User currentUser, Long gymId, SellPassRequest request) {
        Employee employee = employeePermissionService.requireEmployee(currentUser, gymId);
        employeePermissionService.requirePermission(currentUser, gymId, EmployeePermission.SELL_PASSES);
        Guest guest = guestRepository.findById(request.guestId())
                .filter(g -> g.getGym().getId().equals(gymId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono klienta w tej siłowni."));

        GymPass pass = new GymPass();
        pass.setGym(employee.getGym());
        pass.setGuest(guest);
        pass.setPassType(request.passType());
        pass.setStartDate(request.startDate());
        pass.setEndDate(request.endDate());
        pass.setPrice(request.price());
        pass.setSoldByUser(currentUser);
        pass.setStatus(PassStatus.ACTIVE);
        GymPass saved = gymPassRepository.save(pass);

        auditLogService.log(employee.getGym(), currentUser, "PASS_SOLD", "passId=" + saved.getId() + ",guestId=" + guest.getId());
        return new PassView(saved.getId(), guest.getId(), saved.getPassType(), saved.getStatus(), saved.getStartDate(), saved.getEndDate(), saved.getPrice());
    }

    @Transactional
    public void assignLocker(User currentUser, Long gymId, AssignLockerRequest request) {
        Employee employee = employeePermissionService.requireEmployee(currentUser, gymId);
        employeePermissionService.requirePermission(currentUser, gymId, EmployeePermission.MANAGE_LOCKERS);
        Guest guest = guestRepository.findById(request.guestId())
                .filter(g -> g.getGym().getId().equals(gymId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono klienta w tej siłowni."));
        Locker locker = lockerRepository.findById(request.lockerId())
                .filter(l -> l.getGym().getId().equals(gymId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono szafki w tej siłowni."));

        boolean lockerInUse = locker.getStatus() == LockerStatus.OCCUPIED
                || !lockerAssignmentRepository.findByLockerIdAndReturnedAtIsNull(locker.getId()).isEmpty();
        if (lockerInUse) {
            throw new IllegalArgumentException(
                    "Szafka nr " + locker.getLockerNumber() + " jest już zajęta.");
        }
        if (!lockerAssignmentRepository.findByGuestIdAndReturnedAtIsNull(guest.getId()).isEmpty()) {
            throw new IllegalArgumentException(
                    "Klient " + guest.getFirstName() + " " + guest.getLastName() + " ma już przypisaną szafkę.");
        }

        locker.setStatus(LockerStatus.OCCUPIED);
        lockerRepository.save(locker);
        LockerAssignment assignment = new LockerAssignment();
        assignment.setLocker(locker);
        assignment.setGuest(guest);
        assignment.setAssignedByUser(currentUser);
        lockerAssignmentRepository.save(assignment);

        auditLogService.log(employee.getGym(), currentUser, "LOCKER_ASSIGNED", "lockerId=" + locker.getId() + ",guestId=" + guest.getId());
    }

    @Transactional
    public void checkIn(User currentUser, Long gymId, Long guestId) {
        Employee employee = employeePermissionService.requireEmployee(currentUser, gymId);
        employeePermissionService.requirePermission(currentUser, gymId, EmployeePermission.MANAGE_GUESTS);
        Guest guest = requireGuest(gymId, guestId);

        if (guestCheckInRepository.existsByGuestIdAndCheckedOutAtIsNull(guestId)) {
            throw new IllegalArgumentException("Klient jest już zapisany na sali.");
        }
        if (guestPresenceService.findActivePass(gymPassRepository.findByGymId(gymId), guestId).isEmpty()) {
            throw new IllegalArgumentException("Wejście wymaga aktywnego karnetu.");
        }

        GuestCheckIn checkIn = new GuestCheckIn();
        checkIn.setGym(employee.getGym());
        checkIn.setGuest(guest);
        checkIn.setCheckedInByUser(currentUser);
        guestCheckInRepository.save(checkIn);
        auditLogService.log(employee.getGym(), currentUser, "GUEST_CHECK_IN", "guestId=" + guestId);
    }

    @Transactional
    public void checkOut(User currentUser, Long gymId, Long guestId) {
        Employee employee = employeePermissionService.requireEmployee(currentUser, gymId);
        employeePermissionService.requirePermission(currentUser, gymId, EmployeePermission.MANAGE_GUESTS);
        requireGuest(gymId, guestId);

        GuestCheckIn checkIn = guestCheckInRepository.findByGuestIdAndCheckedOutAtIsNull(guestId)
                .orElseThrow(() -> new IllegalArgumentException("Klient nie jest obecny na sali."));
        checkIn.setCheckedOutAt(LocalDateTime.now());
        checkIn.setCheckedOutByUser(currentUser);
        guestCheckInRepository.save(checkIn);
        auditLogService.log(employee.getGym(), currentUser, "GUEST_CHECK_OUT", "guestId=" + guestId);
    }

    @Transactional
    public void leaveGym(User currentUser, Long gymId, Long guestId) {
        Employee employee = employeePermissionService.requireEmployee(currentUser, gymId);
        Guest guest = requireGuest(gymId, guestId);

        boolean checkedIn = guestCheckInRepository.existsByGuestIdAndCheckedOutAtIsNull(guestId);
        List<LockerAssignment> activeAssignments = lockerAssignmentRepository.findByGuestIdAndReturnedAtIsNull(guest.getId());

        if (!checkedIn && activeAssignments.isEmpty()) {
            throw new IllegalArgumentException(
                    "Klient nie jest na sali i nie ma przypisanej szafki.");
        }

        if (checkedIn) {
            checkOut(currentUser, gymId, guestId);
        }

        if (!activeAssignments.isEmpty()) {
            employeePermissionService.requirePermission(currentUser, gymId, EmployeePermission.MANAGE_LOCKERS);
            for (LockerAssignment assignment : activeAssignments) {
                assignment.setReturnedAt(LocalDateTime.now());
                Locker locker = assignment.getLocker();
                locker.setStatus(LockerStatus.AVAILABLE);
                lockerRepository.save(locker);
                lockerAssignmentRepository.save(assignment);
                auditLogService.log(employee.getGym(), currentUser, "LOCKER_RETURNED", "lockerId=" + locker.getId() + ",guestId=" + guest.getId());
            }
        }
    }

    @Transactional
    public void returnLocker(User currentUser, Long gymId, Long guestId) {
        Employee employee = employeePermissionService.requireEmployee(currentUser, gymId);
        employeePermissionService.requirePermission(currentUser, gymId, EmployeePermission.MANAGE_LOCKERS);
        Guest guest = requireGuest(gymId, guestId);

        List<LockerAssignment> activeAssignments = lockerAssignmentRepository.findByGuestIdAndReturnedAtIsNull(guest.getId());
        if (activeAssignments.isEmpty()) {
            throw new IllegalArgumentException("Klient " + guest.getFirstName() + " " + guest.getLastName() + " nie ma przypisanej szafki.");
        }

        for (LockerAssignment assignment : activeAssignments) {
            assignment.setReturnedAt(LocalDateTime.now());
            Locker locker = assignment.getLocker();
            locker.setStatus(LockerStatus.AVAILABLE);
            lockerRepository.save(locker);
            lockerAssignmentRepository.save(assignment);
            auditLogService.log(employee.getGym(), currentUser, "LOCKER_RETURNED", "lockerId=" + locker.getId() + ",guestId=" + guest.getId());
        }
    }

    @Transactional(readOnly = true)
    public List<EmployeeGymView> employeeGyms(User currentUser) {
        return employeeRepository.findByUserId(currentUser.getId())
                .stream()
                .map(e -> new EmployeeGymView(
                        e.getId(),
                        e.getGym().getId(),
                        e.getGym().getName(),
                        e.getGym().getAddress(),
                        employeePermissionService.effectivePermissions(e).stream().map(Enum::name).sorted().toList()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public EmployeeLiveOverview liveOverview(User currentUser, Long gymId) {
        Employee employee = employeePermissionService.requireEmployee(currentUser, gymId);
        var permissions = employeePermissionService.effectivePermissions(employee);
        if (!permissions.contains(EmployeePermission.VIEW_DASHBOARD)
                && !permissions.contains(EmployeePermission.MANAGE_LOCKERS)
                && !permissions.contains(EmployeePermission.SELL_PASSES)) {
            throw new IllegalArgumentException("Brak uprawnień do podglądu danych siłowni.");
        }

        List<LiveLockerView> activeKeys = lockerAssignmentRepository.findByLockerGymIdAndReturnedAtIsNull(gymId).stream()
                .map(a -> new LiveLockerView(
                        a.getLocker().getId(),
                        a.getLocker().getLockerNumber(),
                        a.getGuest().getId(),
                        a.getGuest().getFirstName() + " " + a.getGuest().getLastName(),
                        a.getAssignedAt()
                ))
                .toList();
        var presentGuests = guestPresenceService.presentGuests(gymId);

        List<com.jagorczyk.gymManagement.api.dto.GymDtos.LockerView> allLockers = lockerRepository.findByGymId(gymId).stream()
                .map(l -> {
                    var activeAssignment = lockerAssignmentRepository.findByLockerGymIdAndReturnedAtIsNull(gymId).stream()
                            .filter(a -> a.getLocker().getId().equals(l.getId()))
                            .findFirst();
                    return new com.jagorczyk.gymManagement.api.dto.GymDtos.LockerView(
                            l.getId(),
                            l.getLockerNumber(),
                            l.getStatus(),
                            activeAssignment.map(a -> a.getGuest().getId()).orElse(null)
                    );
                })
                .toList();

        List<PassTypeView> passTypes = passTypeRepository.findByGymId(gymId).stream()
                .map(pt -> new PassTypeView(pt.getId(), pt.getName(), pt.getPrice(), pt.getDurationDays()))
                .toList();

        LocalDate today = LocalDate.now();
        LocalDate expiringUntil = today.plusDays(7);
        List<GymPass> gymPasses = gymPassRepository.findByGymId(gymId);
        List<ExpiringPassView> expiringPasses = gymPasses.stream()
                .filter(p -> p.getStatus() == PassStatus.ACTIVE)
                .filter(p -> !p.getEndDate().isBefore(today) && !p.getEndDate().isAfter(expiringUntil))
                .map(p -> new ExpiringPassView(
                        p.getGuest().getId(),
                        p.getGuest().getFirstName(),
                        p.getGuest().getLastName(),
                        p.getEndDate(),
                        java.time.temporal.ChronoUnit.DAYS.between(today, p.getEndDate())))
                .sorted(java.util.Comparator.comparing(ExpiringPassView::endDate))
                .toList();

        LocalDate weekAgo = today.minusDays(7);
        BigDecimal salesLast7Days = gymPasses.stream()
                .filter(p -> !p.getStartDate().isBefore(weekAgo))
                .map(GymPass::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new EmployeeLiveOverview(activeKeys, presentGuests, allLockers, passTypes, expiringPasses, salesLast7Days);
    }

    @Transactional(readOnly = true)
    public List<GuestView> gymGuests(User currentUser, Long gymId) {
        employeePermissionService.requirePermission(currentUser, gymId, EmployeePermission.MANAGE_GUESTS);

        return buildGuestViews(gymId);
    }

    @Transactional(readOnly = true)
    public GuestDetailView guestDetail(User currentUser, Long gymId, Long guestId) {
        employeePermissionService.requirePermission(currentUser, gymId, EmployeePermission.MANAGE_GUESTS);
        Guest guest = requireGuest(gymId, guestId);
        List<GymPass> passes = gymPassRepository.findByGuestId(guestId);
        Set<Long> checkedIn = guestPresenceService.activeCheckInGuestIds(gymId);
        Set<Long> lockers = guestPresenceService.activeLockerGuestIds(gymId);
        GuestView view = guestPresenceService.toGuestView(guest, passes, checkedIn, lockers);
        List<PassView> passViews = passes.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(guestPresenceService::toPassView)
                .toList();

        List<com.jagorczyk.gymManagement.api.dto.GymDtos.CheckInView> recentCheckIns = guestCheckInRepository.findAll().stream()
                .filter(c -> c.getGuest().getId().equals(guestId))
                .sorted((a, b) -> b.getCheckedInAt().compareTo(a.getCheckedInAt()))
                .limit(10)
                .map(c -> new com.jagorczyk.gymManagement.api.dto.GymDtos.CheckInView(c.getId(), c.getCheckedInAt(), c.getCheckedOutAt()))
                .toList();

        List<com.jagorczyk.gymManagement.api.dto.GymDtos.PassFreezeView> activeFreezes = passFreezeRepository.findAll().stream()
                .filter(f -> f.getGymPass().getGuest().getId().equals(guestId) && !f.isProcessed())
                .map(f -> new com.jagorczyk.gymManagement.api.dto.GymDtos.PassFreezeView(f.getId(), f.getGymPass().getId(), f.getStartDate(), f.getEndDate(), f.isProcessed()))
                .toList();

        return new GuestDetailView(view, passViews, recentCheckIns, activeFreezes);
    }

    @Transactional(readOnly=true)
    public List<com.jagorczyk.gymManagement.api.dto.GymDtos.ProductSaleView> getMyProductSales(User currentUser, Long gymId) {
        Employee employee = employeePermissionService.requireEmployee(currentUser, gymId);
        return productSaleRepository.findAll().stream()
                .filter(s -> s.getGym().getId().equals(gymId) && s.getSoldBy() != null && s.getSoldBy().getId().equals(currentUser.getId()))
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(50)
                .map(s -> new com.jagorczyk.gymManagement.api.dto.GymDtos.ProductSaleView(
                        s.getId(),
                        s.getSoldBy().getEmail(),
                        s.getGuest() != null ? s.getGuest().getFirstName() + " " + s.getGuest().getLastName() : "Anonim",
                        s.getTotalAmount(),
                        s.getPaymentMethod(),
                        s.getCreatedAt(),
                        s.getItems().stream().map(i -> new com.jagorczyk.gymManagement.api.dto.GymDtos.ProductSaleItemView(
                                i.getId(),
                                i.getProduct().getId(),
                                i.getProduct().getName(),
                                i.getQuantity(),
                                i.getUnitPrice()
                        )).toList()
                )).toList();
    }

    @Transactional
    public GuestView updateGuest(User currentUser, Long gymId, Long guestId, UpdateGuestRequest request) {
        Employee employee = employeePermissionService.requireEmployee(currentUser, gymId);
        employeePermissionService.requirePermission(currentUser, gymId, EmployeePermission.MANAGE_GUESTS);
        Guest guest = requireGuest(gymId, guestId);
        guest.setFirstName(request.firstName());
        guest.setLastName(request.lastName());
        guest.setEmail(request.email());
        guest.setPhone(request.phone());
        guest.setNotes(request.notes());
        Guest saved = guestRepository.save(guest);
        auditLogService.log(employee.getGym(), currentUser, "GUEST_UPDATED", "guestId=" + guestId);
        return buildGuestView(saved, gymId);
    }

    private List<GuestView> buildGuestViews(Long gymId) {
        List<Guest> guests = guestRepository.findByGymId(gymId);
        List<GymPass> allPasses = gymPassRepository.findByGymId(gymId);
        Set<Long> checkedIn = guestPresenceService.activeCheckInGuestIds(gymId);
        Set<Long> lockers = guestPresenceService.activeLockerGuestIds(gymId);
        return guests.stream()
                .map(g -> guestPresenceService.toGuestView(g, allPasses, checkedIn, lockers))
                .toList();
    }

    private GuestView buildGuestView(Guest guest, Long gymId) {
        List<GymPass> passes = gymPassRepository.findByGymId(gymId);
        Set<Long> checkedIn = guestPresenceService.activeCheckInGuestIds(gymId);
        Set<Long> lockers = guestPresenceService.activeLockerGuestIds(gymId);
        return guestPresenceService.toGuestView(guest, passes, checkedIn, lockers);
    }

    private Guest requireGuest(Long gymId, Long guestId) {
        return guestRepository.findById(guestId)
                .filter(g -> g.getGym().getId().equals(gymId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono klienta w tej siłowni."));
    }

    @Transactional(readOnly = true)
    public List<GuestView> searchGymGuests(User currentUser, Long gymId, String query) {
        String q = query == null ? "" : query.trim().toLowerCase();
        return gymGuests(currentUser, gymId).stream()
                .filter(g -> q.isBlank()
                        || (g.firstName() + " " + g.lastName()).toLowerCase().contains(q)
                        || (g.email() != null && g.email().toLowerCase().contains(q))
                        || String.valueOf(g.id()).contains(q))
                .toList();
    }

    @Transactional
    public GuestView createGuest(User currentUser, Long gymId, CreateGuestRequest request) {
        Employee employee = employeePermissionService.requireEmployee(currentUser, gymId);
        employeePermissionService.requirePermission(currentUser, gymId, EmployeePermission.MANAGE_GUESTS);
        Guest guest = new Guest();
        guest.setGym(employee.getGym());
        guest.setFirstName(request.firstName());
        guest.setLastName(request.lastName());
        guest.setEmail(request.email());
        guest.setPhone(request.phone());
        guest.setNotes(request.notes());
        if (request.avatarUrl() != null) {
            guest.setAvatarUrl(request.avatarUrl());
        }
        Guest saved = guestRepository.save(guest);
        auditLogService.log(employee.getGym(), currentUser, "GUEST_CREATED", "guestId=" + saved.getId());
        return buildGuestView(saved, gymId);
    }

    @Transactional(readOnly = true)
    public List<PassTypeView> listPassTypes(User currentUser, Long gymId) {
        employeePermissionService.requirePermission(currentUser, gymId, EmployeePermission.MANAGE_PASS_TYPES);
        return passTypeRepository.findByGymId(gymId).stream()
                .map(pt -> new PassTypeView(pt.getId(), pt.getName(), pt.getPrice(), pt.getDurationDays()))
                .toList();
    }

    @Transactional
    public PassTypeView createPassType(User currentUser, Long gymId, CreatePassTypeRequest request) {
        Employee employee = employeePermissionService.requireEmployee(currentUser, gymId);
        employeePermissionService.requirePermission(currentUser, gymId, EmployeePermission.MANAGE_PASS_TYPES);

        if (passTypeRepository.findByGymId(gymId).stream()
                .anyMatch(pt -> pt.getName().equalsIgnoreCase(request.name()))) {
            throw new IllegalArgumentException(
                    "Typ karnetu o nazwie \"" + request.name() + "\" już istnieje w tej siłowni.");
        }

        PassType passType = new PassType();
        passType.setGym(employee.getGym());
        passType.setName(request.name());
        passType.setPrice(request.price());
        passType.setDurationDays(request.durationDays());
        passType = passTypeRepository.save(passType);

        auditLogService.log(employee.getGym(), currentUser, "PASS_TYPE_CREATED", "name=" + passType.getName());
        return new PassTypeView(passType.getId(), passType.getName(), passType.getPrice(), passType.getDurationDays());
    }

    @Transactional
    public void deletePassType(User currentUser, Long gymId, Long passTypeId) {
        Employee employee = employeePermissionService.requireEmployee(currentUser, gymId);
        employeePermissionService.requirePermission(currentUser, gymId, EmployeePermission.MANAGE_PASS_TYPES);
        PassType passType = passTypeRepository.findById(passTypeId)
                .filter(pt -> pt.getGym().getId().equals(gymId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono typu karnetu w tej siłowni."));
        passTypeRepository.delete(passType);
        auditLogService.log(employee.getGym(), currentUser, "PASS_TYPE_DELETED", "passTypeId=" + passTypeId);
    }

    @Transactional
    public LockerView createLocker(User currentUser, Long gymId, CreateLockerRequest request) {
        Employee employee = employeePermissionService.requireEmployee(currentUser, gymId);
        employeePermissionService.requirePermission(currentUser, gymId, EmployeePermission.CREATE_LOCKERS);

        if (lockerRepository.findByGymId(gymId).stream().anyMatch(l -> l.getLockerNumber().equals(request.lockerNumber()))) {
            throw new IllegalArgumentException(
                    "Szafka o numerze " + request.lockerNumber() + " już istnieje w tej siłowni.");
        }

        Locker locker = new Locker();
        locker.setGym(employee.getGym());
        locker.setLockerNumber(request.lockerNumber());
        locker.setStatus(LockerStatus.AVAILABLE);
        locker = lockerRepository.save(locker);

        auditLogService.log(employee.getGym(), currentUser, "LOCKER_CREATED", "lockerNumber=" + locker.getLockerNumber());
        return new LockerView(locker.getId(), locker.getLockerNumber(), locker.getStatus(), null);
    }

    @Transactional(readOnly = true)
    public Guest findGuestByUserIdAndGymId(Long userId, Long gymId) {
        return guestRepository.findByUserIdAndGymId(userId, gymId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono zarejestrowanego gościa dla tego użytkownika w tym klubie."));
    }
}
