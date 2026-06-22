package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.GymDtos.AuditLogView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.CreateEmployeeRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.CreateGymRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.CreateLockerRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.CreatePassTypeRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.EmployeeView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.GuestDetailView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.GuestView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.GymSummary;
import com.jagorczyk.gymManagement.api.dto.GymDtos.LockerView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.ExpiringPassItem;
import com.jagorczyk.gymManagement.api.dto.GymDtos.OwnerDashboardStats;
import com.jagorczyk.gymManagement.api.dto.GymDtos.OwnerGymDetails;
import com.jagorczyk.gymManagement.api.dto.GymDtos.PageResponse;
import com.jagorczyk.gymManagement.api.dto.GymDtos.PassTypeView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.PassView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.UpdateEmployeeRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.UpdateGuestRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.UpdateGymRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.UpdatePassTypeRequest;
import com.jagorczyk.gymManagement.domain.Employee;
import com.jagorczyk.gymManagement.domain.EmployeePermission;
import com.jagorczyk.gymManagement.domain.Guest;
import com.jagorczyk.gymManagement.domain.Gym;
import com.jagorczyk.gymManagement.domain.GymPass;
import com.jagorczyk.gymManagement.domain.Locker;
import com.jagorczyk.gymManagement.domain.LockerAssignment;
import com.jagorczyk.gymManagement.domain.LockerStatus;
import com.jagorczyk.gymManagement.domain.PassStatus;
import com.jagorczyk.gymManagement.domain.PassType;
import com.jagorczyk.gymManagement.domain.Role;
import com.jagorczyk.gymManagement.domain.User;
import com.jagorczyk.gymManagement.repository.AuditLogRepository;
import com.jagorczyk.gymManagement.repository.EmployeeRepository;
import com.jagorczyk.gymManagement.repository.GuestRepository;
import com.jagorczyk.gymManagement.repository.GymPassRepository;
import com.jagorczyk.gymManagement.repository.GymRepository;
import com.jagorczyk.gymManagement.repository.LockerAssignmentRepository;
import com.jagorczyk.gymManagement.repository.LockerRepository;
import com.jagorczyk.gymManagement.repository.PassTypeRepository;
import com.jagorczyk.gymManagement.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OwnerService {
    private final GymRepository gymRepository;
    private final GuestRepository guestRepository;
    private final EmployeeRepository employeeRepository;
    private final GymPassRepository gymPassRepository;
    private final LockerRepository lockerRepository;
    private final LockerAssignmentRepository lockerAssignmentRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;
    private final PassTypeRepository passTypeRepository;
    private final GuestPresenceService guestPresenceService;
    private final com.jagorczyk.gymManagement.repository.EmployeeRankRepository rankRepository;
    private final com.jagorczyk.gymManagement.repository.GuestCheckInRepository guestCheckInRepository;
    private final com.jagorczyk.gymManagement.repository.PassFreezeRepository passFreezeRepository;
    private final com.jagorczyk.gymManagement.repository.PersonalTrainerProfileRepository personalTrainerProfileRepository;
    private final com.jagorczyk.gymManagement.repository.GymSubscriptionRepository gymSubscriptionRepository;
    private final StripeService stripeService;
    private final SubdomainService subdomainService;

    public OwnerService(
            GymRepository gymRepository,
            GuestRepository guestRepository,
            EmployeeRepository employeeRepository,
            GymPassRepository gymPassRepository,
            LockerRepository lockerRepository,
            LockerAssignmentRepository lockerAssignmentRepository,
            AuditLogRepository auditLogRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuditLogService auditLogService,
            PassTypeRepository passTypeRepository,
            GuestPresenceService guestPresenceService,
            com.jagorczyk.gymManagement.repository.EmployeeRankRepository rankRepository,
            com.jagorczyk.gymManagement.repository.GuestCheckInRepository guestCheckInRepository,
            com.jagorczyk.gymManagement.repository.PassFreezeRepository passFreezeRepository,
            com.jagorczyk.gymManagement.repository.PersonalTrainerProfileRepository personalTrainerProfileRepository,
            com.jagorczyk.gymManagement.repository.GymSubscriptionRepository gymSubscriptionRepository,
            StripeService stripeService,
            SubdomainService subdomainService
    ) {
        this.gymRepository = gymRepository;
        this.guestRepository = guestRepository;
        this.employeeRepository = employeeRepository;
        this.gymPassRepository = gymPassRepository;
        this.lockerRepository = lockerRepository;
        this.lockerAssignmentRepository = lockerAssignmentRepository;
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLogService = auditLogService;
        this.passTypeRepository = passTypeRepository;
        this.guestPresenceService = guestPresenceService;
        this.rankRepository = rankRepository;
        this.guestCheckInRepository = guestCheckInRepository;
        this.passFreezeRepository = passFreezeRepository;
        this.personalTrainerProfileRepository = personalTrainerProfileRepository;
        this.gymSubscriptionRepository = gymSubscriptionRepository;
        this.stripeService = stripeService;
        this.subdomainService = subdomainService;
    }

    @Transactional
    public String createGymSubscriptionCheckout(Long ownerId, Long gymId) {
        Gym gym = gymRepository.findById(gymId)
                .filter(g -> g.getOwnerUser().getId().equals(ownerId))
                .orElseThrow(() -> new IllegalArgumentException("Gym not found or access denied"));
        com.jagorczyk.gymManagement.domain.GymSubscription subscription = gymSubscriptionRepository.findByGymId(gymId)
                .orElseThrow(() -> new IllegalArgumentException("No subscription found"));
        try {
            return stripeService.createSaaSSubscriptionCheckout(subscription.getSaasPlan(), gymId);
        } catch (com.stripe.exception.StripeException e) {
            throw new RuntimeException("Payment error: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public com.jagorczyk.gymManagement.api.dto.GymDtos.GymSubscriptionView getGymSubscription(Long ownerUserId, Long gymId) {
        requireOwnerGym(ownerUserId, gymId);
        return gymSubscriptionRepository.findByGymId(gymId)
                .map(sub -> new com.jagorczyk.gymManagement.api.dto.GymDtos.GymSubscriptionView(
                        sub.getId(),
                        sub.getSaasPlan().getId(),
                        sub.getSaasPlan().getName(),
                        sub.getStatus().name(),
                        sub.getCurrentPeriodStart() != null ? sub.getCurrentPeriodStart().toString() : null,
                        sub.getCurrentPeriodEnd() != null ? sub.getCurrentPeriodEnd().toString() : null,
                        sub.getSaasPlan().getFeatureFlags()
                ))
                .orElse(null);
    }

    @Transactional
    public String createCustomerPortalSession(Long ownerUserId, Long gymId) {
        requireOwnerGym(ownerUserId, gymId);
        com.jagorczyk.gymManagement.domain.GymSubscription sub = gymSubscriptionRepository.findByGymId(gymId)
                .orElseThrow(() -> new IllegalArgumentException("No subscription found"));
        if (sub.getStripeCustomerId() == null || sub.getStripeCustomerId().isEmpty()) {
            throw new IllegalArgumentException("No Stripe Customer ID found for this subscription. Please purchase a plan first.");
        }
        try {
            return stripeService.createCustomerPortalSession(sub.getStripeCustomerId(), gymId);
        } catch (com.stripe.exception.StripeException e) {
            throw new RuntimeException("Error creating portal session: " + e.getMessage());
        }
    }

    public List<GymSummary> ownerGyms(Long ownerUserId) {
        return gymRepository.findByOwnerUserId(ownerUserId).stream()
                .map(g -> new GymSummary(g.getId(), g.getName(), g.getAddress(), g.getCity(), g.getPostalCode(), g.getNip(), g.getThemeColor(), g.getSubdomain()))
                .toList();
    }

    @Transactional(readOnly = true)
    public OwnerGymDetails gymDetails(Long ownerUserId, Long gymId) {
        Gym gym = requireOwnerGym(ownerUserId, gymId);

        List<GymPass> allPasses = gymPassRepository.findByGymId(gymId);
        Map<Long, LockerAssignment> assignmentsByLockerId = lockerAssignmentRepository
                .findByLockerGymIdAndReturnedAtIsNull(gymId).stream()
                .collect(Collectors.toMap(a -> a.getLocker().getId(), a -> a, (a, b) -> a));

        List<EmployeeView> employees = employeeRepository.findByGymId(gymId).stream()
                .map(this::toEmployeeView)
                .toList();
        List<PassView> passes = allPasses.stream()
                .map(guestPresenceService::toPassView)
                .toList();
        List<LockerView> lockers = lockerRepository.findByGymId(gymId).stream()
                .map(locker -> toLockerView(locker, assignmentsByLockerId.get(locker.getId())))
                .toList();
        List<AuditLogView> logs = auditLogRepository.findTop100ByGymIdOrderByCreatedAtDesc(gymId).stream()
                .map(log -> new AuditLogView(
                        log.getId(),
                        log.getAction(),
                        log.getPayload(),
                        log.getCreatedAt(),
                        log.getActorUser() != null ? log.getActorUser().getEmail() : null
                ))
                .toList();
        List<PassTypeView> passTypes = passTypeRepository.findByGymId(gymId).stream()
                .map(pt -> new PassTypeView(pt.getId(), pt.getName(), pt.getPrice(), pt.getDurationDays()))
                .toList();
        return new OwnerGymDetails(
                new GymSummary(gym.getId(), gym.getName(), gym.getAddress(), gym.getCity(), gym.getPostalCode(), gym.getNip(), gym.getThemeColor(), gym.getSubdomain()),
                employees,
                passes,
                lockers,
                logs,
                passTypes
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<GuestView> ownerGuests(Long ownerUserId, Long gymId, String q, int page, int size) {
        requireOwnerGym(ownerUserId, gymId);
        int safeSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(Math.max(page, 0), safeSize, Sort.by("lastName", "firstName"));
        String query = q == null ? "" : q.trim();
        Page<Guest> guestPage = guestRepository.searchByGymId(gymId, query.isEmpty() ? null : query, pageable);
        List<GymPass> allPasses = gymPassRepository.findByGymId(gymId);
        Set<Long> checkedIn = guestPresenceService.activeCheckInGuestIds(gymId);
        Set<Long> lockerGuests = guestPresenceService.activeLockerGuestIds(gymId);
        List<GuestView> content = guestPage.getContent().stream()
                .map(g -> guestPresenceService.toGuestView(g, allPasses, checkedIn, lockerGuests))
                .toList();
        return new PageResponse<>(content, guestPage.getNumber(), guestPage.getSize(), guestPage.getTotalElements(), guestPage.getTotalPages());
    }

    @Transactional(readOnly = true)
    public OwnerDashboardStats dashboardStats(Long ownerUserId, Long gymId) {
        requireOwnerGym(ownerUserId, gymId);

        int presentNow = guestPresenceService.activeCheckInGuestIds(gymId).size();
        List<Locker> lockers = lockerRepository.findByGymId(gymId);
        int freeLockers = (int) lockers.stream().filter(l -> l.getStatus() == LockerStatus.AVAILABLE).count();
        int occupiedLockers = (int) lockers.stream().filter(l -> l.getStatus() == LockerStatus.OCCUPIED).count();

        LocalDate today = LocalDate.now();
        LocalDate weekAgo = today.minusDays(7);
        LocalDate expiringUntil = today.plusDays(7);
        List<GymPass> gymPasses = gymPassRepository.findByGymId(gymId);
        int activePassesCount = (int) gymPasses.stream().filter(p -> p.getStatus() == PassStatus.ACTIVE).count();
        BigDecimal salesLast7Days = gymPasses.stream()
                .filter(p -> !p.getStartDate().isBefore(weekAgo))
                .map(GymPass::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<ExpiringPassItem> expiringPasses = gymPasses.stream()
                .filter(p -> p.getStatus() == PassStatus.ACTIVE)
                .filter(p -> !p.getEndDate().isBefore(today) && !p.getEndDate().isAfter(expiringUntil))
                .map(p -> new ExpiringPassItem(
                        p.getGuest().getId(),
                        p.getGuest().getFirstName(),
                        p.getGuest().getLastName(),
                        p.getEndDate(),
                        ChronoUnit.DAYS.between(today, p.getEndDate())
                ))
                .sorted(Comparator.comparing(ExpiringPassItem::endDate))
                .toList();

        return new OwnerDashboardStats(
                presentNow,
                freeLockers,
                occupiedLockers,
                expiringPasses.size(),
                activePassesCount,
                salesLast7Days,
                expiringPasses
        );
    }

    private LockerView toLockerView(Locker locker, LockerAssignment assignment) {
        if (assignment == null) {
            return new LockerView(locker.getId(), locker.getLockerNumber(), locker.getStatus(), null, null, null);
        }
        Guest guest = assignment.getGuest();
        return new LockerView(
                locker.getId(),
                locker.getLockerNumber(),
                locker.getStatus(),
                guest.getId(),
                guest.getFirstName(),
                guest.getLastName()
        );
    }

    @Transactional
    public GymSummary createGym(Long ownerUserId, CreateGymRequest request) {
        User owner = userRepository.findById(ownerUserId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono właściciela konta."));
        Gym gym = new Gym();
        gym.setName(request.name());
        gym.setAddress(request.address());
        gym.setCity(request.city());
        gym.setPostalCode(request.postalCode());
        gym.setNip(request.nip());
        
        java.util.List<Gym> existingGyms = gymRepository.findByOwnerUserId(ownerUserId);
        if (!existingGyms.isEmpty()) {
            Gym firstGym = existingGyms.get(0);
            gym.setName(firstGym.getName()); // wymuszamy stałą nazwę
            gym.setSubdomain(firstGym.getSubdomain());
            gym.setThemeColor(firstGym.getThemeColor());
        } else {
            gym.setSubdomain(subdomainService.generateUniqueSubdomain(request.name()));
        }

        if (request.themeColor() != null) gym.setThemeColor(request.themeColor());
        gym.setOwnerUser(owner);
        Gym saved = gymRepository.save(gym);
        auditLogService.log(saved, owner, "GYM_CREATED", "gymId=" + saved.getId());
        return new GymSummary(saved.getId(), saved.getName(), saved.getAddress(), saved.getCity(), saved.getPostalCode(), saved.getNip(), saved.getThemeColor(), saved.getSubdomain());
    }

    @Transactional
    public EmployeeView createEmployee(Long ownerUserId, Long gymId, CreateEmployeeRequest request) {
        Gym gym = gymRepository.findById(gymId)
                .filter(g -> g.getOwnerUser().getId().equals(ownerUserId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono siłowni lub brak uprawnień właściciela."));

        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new IllegalArgumentException(
                    "Pracownik z adresem e-mail " + request.email() + " już istnieje w systemie.");
        }
        User employeeUser = new User();
        employeeUser.setEmail(request.email());
        employeeUser.setPasswordHash(passwordEncoder.encode(request.password()));
        employeeUser.setRole(Role.EMPLOYEE);
        if (request.firstName() != null) {
            employeeUser.setFirstName(request.firstName());
        }
        if (request.lastName() != null) {
            employeeUser.setLastName(request.lastName());
        }
        if (request.avatarUrl() != null) {
            employeeUser.setAvatarUrl(request.avatarUrl());
        }
        employeeUser = userRepository.save(employeeUser);

        Employee employee = new Employee();
        employee.setGym(gym);
        employee.setUser(employeeUser);
        if (request.rankId() != null) {
            com.jagorczyk.gymManagement.domain.EmployeeRank rank = rankRepository.findById(request.rankId())
                    .filter(r -> r.getGym().getId().equals(gymId))
                    .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono rangi."));
            employee.setRank(rank);
        } else {
            employee.setPermissions(EmployeePermission.resolve(request.permissions()));
        }
        employee = employeeRepository.save(employee);

        syncTrainerProfile(gym, employee);

        auditLogService.log(gym, gym.getOwnerUser(), "EMPLOYEE_CREATED", "employeeUserId=" + employeeUser.getId());
        return toEmployeeView(employee);
    }

    private void syncTrainerProfile(Gym gym, Employee employee) {
        boolean isTrainer = false;
        if (employee.getRank() != null) {
            isTrainer = employee.getRank().getPermissions().contains(EmployeePermission.PERSONAL_TRAINER);
        }
        if (employee.getPermissions() != null && employee.getPermissions().contains(EmployeePermission.PERSONAL_TRAINER)) {
            isTrainer = true;
        }

        if (isTrainer && personalTrainerProfileRepository.findByEmployeeId(employee.getId()).isEmpty()) {
            com.jagorczyk.gymManagement.domain.PersonalTrainerProfile profile = new com.jagorczyk.gymManagement.domain.PersonalTrainerProfile();
            profile.setGym(gym);
            profile.setEmployee(employee);
            profile.setBio("");
            profile.setSpecialization("");
            profile.setHourlyRate(java.math.BigDecimal.ZERO);
            personalTrainerProfileRepository.save(profile);
        }
    }

    @Transactional
    public GymSummary updateGym(Long ownerUserId, Long gymId, UpdateGymRequest request) {
        Gym gym = gymRepository.findById(gymId)
                .filter(g -> g.getOwnerUser().getId().equals(ownerUserId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono siłowni lub brak uprawnień właściciela."));

        boolean initialSetup = SubdomainService.isPlaceholderGymName(gym.getName()) || "-".equals(gym.getAddress());
        if (initialSetup) {
            String subdomain = subdomainService.toSubdomainSlug(request.name());
            if (!subdomainService.isSubdomainAvailable(subdomain, gym.getId())) {
                throw new IllegalArgumentException("Adres " + subdomain + ".gymlos.pl jest już zajęty. Wybierz inną nazwę siłowni.");
            }
            gym.setName(request.name());
            gym.setSubdomain(subdomain);
        }

        gym.setAddress(request.address());
        gym.setCity(request.city());
        gym.setPostalCode(request.postalCode());
        gym.setNip(request.nip());
        if (request.themeColor() != null) gym.setThemeColor(request.themeColor());
        Gym saved = gymRepository.save(gym);
        auditLogService.log(saved, saved.getOwnerUser(), "GYM_UPDATED", "gymId=" + saved.getId());
        return new GymSummary(saved.getId(), saved.getName(), saved.getAddress(), saved.getCity(), saved.getPostalCode(), saved.getNip(), saved.getThemeColor(), saved.getSubdomain());
    }

    @Transactional
    public GymSummary updateGymTheme(Long ownerUserId, Long gymId, String themeColor) {
        Gym gym = gymRepository.findById(gymId)
                .filter(g -> g.getOwnerUser().getId().equals(ownerUserId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono siłowni lub brak uprawnień właściciela."));
        gym.setThemeColor(themeColor);
        Gym saved = gymRepository.save(gym);
        auditLogService.log(saved, saved.getOwnerUser(), "GYM_THEME_UPDATED", "gymId=" + saved.getId() + ",theme=" + themeColor);
        return new GymSummary(saved.getId(), saved.getName(), saved.getAddress(), saved.getCity(), saved.getPostalCode(), saved.getNip(), saved.getThemeColor(), saved.getSubdomain());
    }

    @Transactional
    public void deleteGym(Long ownerUserId, Long gymId) {
        Gym gym = gymRepository.findById(gymId)
                .filter(g -> g.getOwnerUser().getId().equals(ownerUserId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono siłowni lub brak uprawnień właściciela."));
        if (guestRepository.countByGymId(gymId) > 0
                || employeeRepository.countByGymId(gymId) > 0
                || gymPassRepository.countByGymId(gymId) > 0
                || lockerRepository.countByGymId(gymId) > 0) {
            throw new IllegalArgumentException(
                    "Nie można usunąć siłowni, ponieważ zawiera powiązane dane (klienci, pracownicy, karnety lub szafki).");
        }
        gymRepository.delete(gym);
    }

    @Transactional
    public EmployeeView updateEmployee(Long ownerUserId, Long gymId, Long employeeId, UpdateEmployeeRequest request) {
        Gym gym = gymRepository.findById(gymId)
                .filter(g -> g.getOwnerUser().getId().equals(ownerUserId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono siłowni lub brak uprawnień właściciela."));
        Employee employee = employeeRepository.findByIdAndGymId(employeeId, gymId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono pracownika w tej siłowni."));
        User user = employee.getUser();
        userRepository.findByEmail(request.email()).ifPresent(existing -> {
            if (!existing.getId().equals(user.getId())) {
                throw new IllegalArgumentException(
                        "Pracownik z adresem e-mail " + request.email() + " już istnieje w systemie.");
            }
        });
        user.setEmail(request.email());
        if (request.firstName() != null) {
            user.setFirstName(request.firstName());
        }
        if (request.lastName() != null) {
            user.setLastName(request.lastName());
        }
        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(request.avatarUrl());
        }
        userRepository.save(user);
        boolean changedPermissions = false;
        if (request.rankId() != null) {
            com.jagorczyk.gymManagement.domain.EmployeeRank rank = rankRepository.findById(request.rankId())
                    .filter(r -> r.getGym().getId().equals(gymId))
                    .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono rangi."));
            employee.setRank(rank);
            changedPermissions = true;
        } else if (request.permissions() != null) {
            employee.setRank(null);
            employee.setPermissions(EmployeePermission.resolve(request.permissions()));
            changedPermissions = true;
        }
        if (changedPermissions) {
            employeeRepository.save(employee);
            syncTrainerProfile(gym, employee);
            auditLogService.log(gym, gym.getOwnerUser(), "EMPLOYEE_PERMISSIONS_UPDATED", "employeeId=" + employeeId);
        }
        auditLogService.log(gym, gym.getOwnerUser(), "EMPLOYEE_UPDATED", "employeeId=" + employeeId);
        return toEmployeeView(employee);
    }

    @Transactional
    public void deleteEmployee(Long ownerUserId, Long gymId, Long employeeId) {
        Gym gym = gymRepository.findById(gymId)
                .filter(g -> g.getOwnerUser().getId().equals(ownerUserId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono siłowni lub brak uprawnień właściciela."));
        Employee employee = employeeRepository.findByIdAndGymId(employeeId, gymId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono pracownika w tej siłowni."));
        employeeRepository.delete(employee);
        auditLogService.log(gym, gym.getOwnerUser(), "EMPLOYEE_DELETED", "employeeId=" + employeeId);
    }

    @Transactional
    public LockerView createLocker(Long ownerUserId, Long gymId, CreateLockerRequest request) {
        Gym gym = gymRepository.findById(gymId)
                .filter(g -> g.getOwnerUser().getId().equals(ownerUserId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono siłowni lub brak uprawnień właściciela."));

        if (lockerRepository.findByGymId(gymId).stream().anyMatch(l -> l.getLockerNumber().equals(request.lockerNumber()))) {
            throw new IllegalArgumentException(
                    "Szafka o numerze " + request.lockerNumber() + " już istnieje w tej siłowni.");
        }

        com.jagorczyk.gymManagement.domain.Locker locker = new com.jagorczyk.gymManagement.domain.Locker();
        locker.setGym(gym);
        locker.setLockerNumber(request.lockerNumber());
        locker.setStatus(com.jagorczyk.gymManagement.domain.LockerStatus.AVAILABLE);
        locker = lockerRepository.save(locker);

        auditLogService.log(gym, gym.getOwnerUser(), "LOCKER_CREATED", "lockerNumber=" + locker.getLockerNumber());
        return new LockerView(locker.getId(), locker.getLockerNumber(), locker.getStatus(), null, null, null);
    }

    @Transactional
    public PassTypeView createPassType(Long ownerUserId, Long gymId, CreatePassTypeRequest request) {
        Gym gym = gymRepository.findById(gymId)
                .filter(g -> g.getOwnerUser().getId().equals(ownerUserId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono siłowni lub brak uprawnień właściciela."));

        if (passTypeRepository.findByGymId(gymId).stream()
                .anyMatch(pt -> pt.getName().equalsIgnoreCase(request.name()))) {
            throw new IllegalArgumentException(
                    "Typ karnetu o nazwie \"" + request.name() + "\" już istnieje w tej siłowni.");
        }

        PassType passType = new PassType();
        passType.setGym(gym);
        passType.setName(request.name());
        passType.setPrice(request.price());
        passType.setDurationDays(request.durationDays());
        passType = passTypeRepository.save(passType);

        auditLogService.log(gym, gym.getOwnerUser(), "PASS_TYPE_CREATED", "name=" + passType.getName());
        return new PassTypeView(passType.getId(), passType.getName(), passType.getPrice(), passType.getDurationDays());
    }

    @Transactional
    public void deletePassType(Long ownerUserId, Long gymId, Long passTypeId) {
        Gym gym = gymRepository.findById(gymId)
                .filter(g -> g.getOwnerUser().getId().equals(ownerUserId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono siłowni lub brak uprawnień właściciela."));
        PassType passType = passTypeRepository.findById(passTypeId)
                .filter(pt -> pt.getGym().getId().equals(gymId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono typu karnetu w tej siłowni."));
        passTypeRepository.delete(passType);
        auditLogService.log(gym, gym.getOwnerUser(), "PASS_TYPE_DELETED", "passTypeId=" + passTypeId);
    }

    @Transactional
    public PassTypeView updatePassType(
            Long ownerUserId,
            Long gymId,
            Long passTypeId,
            UpdatePassTypeRequest request
    ) {
        Gym gym = requireOwnerGym(ownerUserId, gymId);
        PassType passType = passTypeRepository.findById(passTypeId)
                .filter(pt -> pt.getGym().getId().equals(gymId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono typu karnetu w tej siłowni."));
        if (passTypeRepository.findByGymId(gymId).stream()
                .anyMatch(pt -> !pt.getId().equals(passTypeId) && pt.getName().equalsIgnoreCase(request.name()))) {
            throw new IllegalArgumentException(
                    "Typ karnetu o nazwie \"" + request.name() + "\" już istnieje w tej siłowni.");
        }
        passType.setName(request.name());
        passType.setPrice(request.price());
        passType.setDurationDays(request.durationDays());
        passType = passTypeRepository.save(passType);
        auditLogService.log(gym, gym.getOwnerUser(), "PASS_TYPE_UPDATED", "passTypeId=" + passTypeId);
        return new PassTypeView(passType.getId(), passType.getName(), passType.getPrice(), passType.getDurationDays());
    }

    @Transactional(readOnly = true)
    public GuestDetailView guestDetail(Long ownerUserId, Long gymId, Long guestId) {
        requireOwnerGym(ownerUserId, gymId);
        Guest guest = guestRepository.findById(guestId)
                .filter(g -> g.getGym().getId().equals(gymId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono klienta w tej siłowni."));
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

    @Transactional
    public GuestView updateGuest(Long ownerUserId, Long gymId, Long guestId, UpdateGuestRequest request) {
        Gym gym = requireOwnerGym(ownerUserId, gymId);
        Guest guest = guestRepository.findById(guestId)
                .filter(g -> g.getGym().getId().equals(gymId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono klienta w tej siłowni."));
        guest.setFirstName(request.firstName());
        guest.setLastName(request.lastName());
        guest.setEmail(request.email());
        guest.setPhone(request.phone());
        guest.setNotes(request.notes());
        if (request.avatarUrl() != null) {
            guest.setAvatarUrl(request.avatarUrl());
        }
        Guest saved = guestRepository.save(guest);
        auditLogService.log(gym, gym.getOwnerUser(), "GUEST_UPDATED", "guestId=" + guestId);
        List<GymPass> passes = gymPassRepository.findByGymId(gymId);
        Set<Long> checkedIn = guestPresenceService.activeCheckInGuestIds(gymId);
        Set<Long> lockerGuests = guestPresenceService.activeLockerGuestIds(gymId);
        return guestPresenceService.toGuestView(saved, passes, checkedIn, lockerGuests);
    }

    @Transactional(readOnly = true)
    public List<AuditLogView> searchAuditLogs(
            Long ownerUserId,
            Long gymId,
            LocalDateTime from,
            LocalDateTime to,
            String action,
            String actorEmail
    ) {
        requireOwnerGym(ownerUserId, gymId);
        return auditLogRepository.searchByGym(gymId, from, to, action, actorEmail).stream()
                .limit(200)
                .map(log -> new AuditLogView(
                        log.getId(),
                        log.getAction(),
                        log.getPayload(),
                        log.getCreatedAt(),
                        log.getActorUser() != null ? log.getActorUser().getEmail() : null
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<com.jagorczyk.gymManagement.api.dto.GymDtos.RankView> getRanks(Long ownerUserId, Long gymId) {
        requireOwnerGym(ownerUserId, gymId);
        return rankRepository.findByGymId(gymId).stream()
                .map(this::toRankView)
                .toList();
    }

    @Transactional
    public com.jagorczyk.gymManagement.api.dto.GymDtos.RankView createRank(Long ownerUserId, Long gymId, com.jagorczyk.gymManagement.api.dto.GymDtos.CreateRankRequest request) {
        Gym gym = requireOwnerGym(ownerUserId, gymId);
        com.jagorczyk.gymManagement.domain.EmployeeRank rank = new com.jagorczyk.gymManagement.domain.EmployeeRank();
        rank.setGym(gym);
        rank.setName(request.name());
        rank.setPermissions(EmployeePermission.resolve(request.permissions()));
        rank = rankRepository.save(rank);
        auditLogService.log(gym, gym.getOwnerUser(), "RANK_CREATED", "rankId=" + rank.getId());
        return toRankView(rank);
    }

    @Transactional
    public com.jagorczyk.gymManagement.api.dto.GymDtos.RankView updateRank(Long ownerUserId, Long gymId, Long rankId, com.jagorczyk.gymManagement.api.dto.GymDtos.UpdateRankRequest request) {
        Gym gym = requireOwnerGym(ownerUserId, gymId);
        com.jagorczyk.gymManagement.domain.EmployeeRank rank = rankRepository.findById(rankId)
                .filter(r -> r.getGym().getId().equals(gymId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono rangi."));
        rank.setName(request.name());
        rank.setPermissions(EmployeePermission.resolve(request.permissions()));
        rank = rankRepository.save(rank);
        if (rank.getPermissions().contains(EmployeePermission.PERSONAL_TRAINER)) {
            employeeRepository.findByGymId(gymId).stream()
                .filter(e -> e.getRank() != null && e.getRank().getId().equals(rankId))
                .forEach(e -> syncTrainerProfile(gym, e));
        }
        auditLogService.log(gym, gym.getOwnerUser(), "RANK_UPDATED", "rankId=" + rankId);
        return toRankView(rank);
    }

    @Transactional
    public void deleteRank(Long ownerUserId, Long gymId, Long rankId) {
        Gym gym = requireOwnerGym(ownerUserId, gymId);
        com.jagorczyk.gymManagement.domain.EmployeeRank rank = rankRepository.findById(rankId)
                .filter(r -> r.getGym().getId().equals(gymId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono rangi."));
        rankRepository.delete(rank);
        auditLogService.log(gym, gym.getOwnerUser(), "RANK_DELETED", "rankId=" + rankId);
    }

    private com.jagorczyk.gymManagement.api.dto.GymDtos.RankView toRankView(com.jagorczyk.gymManagement.domain.EmployeeRank rank) {
        List<String> perms = rank.getPermissions().stream().map(Enum::name).sorted().toList();
        return new com.jagorczyk.gymManagement.api.dto.GymDtos.RankView(rank.getId(), rank.getName(), perms);
    }

    private Gym requireOwnerGym(Long ownerUserId, Long gymId) {
        return gymRepository.findById(gymId)
                .filter(g -> g.getOwnerUser().getId().equals(ownerUserId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono siłowni lub brak uprawnień właściciela."));
    }

    private EmployeeView toEmployeeView(Employee employee) {
        java.util.Set<EmployeePermission> effectivePerms;
        if (employee.getRank() != null) {
            effectivePerms = new java.util.HashSet<>(employee.getRank().getPermissions());
            effectivePerms.addAll(employee.getPermissions());
        } else {
            effectivePerms = employee.getPermissions();
        }
        List<String> permissions = effectivePerms.stream()
                .map(Enum::name)
                .sorted()
                .toList();
        return new EmployeeView(
                employee.getId(),
                employee.getUser().getId(),
                employee.getUser().getEmail(),
                employee.getUser().getFirstName(),
                employee.getUser().getLastName(),
                permissions,
                employee.getRank() != null ? employee.getRank().getId() : null,
                employee.getRank() != null ? employee.getRank().getName() : null,
                employee.getUser().getAvatarUrl()
        );
    }

    @Transactional(readOnly = true)
    public List<com.jagorczyk.gymManagement.api.dto.GymDtos.TrainerProfileView> getTrainers(Long ownerUserId, Long gymId) {
        requireOwnerGym(ownerUserId, gymId);
        return personalTrainerProfileRepository.findByGymId(gymId).stream()
                .map(p -> new com.jagorczyk.gymManagement.api.dto.GymDtos.TrainerProfileView(
                        p.getId(),
                        p.getEmployee().getId(),
                        p.getEmployee().getUser().getFirstName(),
                        p.getEmployee().getUser().getLastName(),
                        p.getBio(),
                        p.getSpecialization(),
                        p.getHourlyRate()
                ))
                .toList();
    }

    @Transactional
    public com.jagorczyk.gymManagement.api.dto.GymDtos.TrainerProfileView createTrainer(Long ownerUserId, Long gymId, com.jagorczyk.gymManagement.api.dto.GymDtos.CreateTrainerProfileRequest request) {
        Gym gym = requireOwnerGym(ownerUserId, gymId);
        Employee employee = employeeRepository.findByIdAndGymId(request.employeeId(), gymId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono pracownika w tej siłowni."));

        if (!personalTrainerProfileRepository.findByEmployeeId(request.employeeId()).isEmpty()) {
            throw new IllegalArgumentException("Ten pracownik jest już trenerem.");
        }

        com.jagorczyk.gymManagement.domain.PersonalTrainerProfile profile = new com.jagorczyk.gymManagement.domain.PersonalTrainerProfile();
        profile.setGym(gym);
        profile.setEmployee(employee);
        profile.setBio(request.bio());
        profile.setSpecialization(request.specialization());
        profile.setHourlyRate(request.hourlyRate());
        
        profile = personalTrainerProfileRepository.save(profile);
        auditLogService.log(gym, gym.getOwnerUser(), "TRAINER_CREATED", "trainerId=" + profile.getId());

        return new com.jagorczyk.gymManagement.api.dto.GymDtos.TrainerProfileView(
                profile.getId(),
                profile.getEmployee().getId(),
                profile.getEmployee().getUser().getFirstName(),
                profile.getEmployee().getUser().getLastName(),
                profile.getBio(),
                profile.getSpecialization(),
                profile.getHourlyRate()
        );
    }

    @Transactional
    public com.jagorczyk.gymManagement.api.dto.GymDtos.TrainerProfileView updateTrainer(Long ownerUserId, Long gymId, Long trainerId, com.jagorczyk.gymManagement.api.dto.GymDtos.UpdateTrainerProfileRequest request) {
        Gym gym = requireOwnerGym(ownerUserId, gymId);
        com.jagorczyk.gymManagement.domain.PersonalTrainerProfile profile = personalTrainerProfileRepository.findById(trainerId)
                .filter(p -> p.getGym().getId().equals(gymId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono profilu trenera w tej siłowni."));

        profile.setBio(request.bio());
        profile.setSpecialization(request.specialization());
        profile.setHourlyRate(request.hourlyRate());
        
        profile = personalTrainerProfileRepository.save(profile);
        auditLogService.log(gym, gym.getOwnerUser(), "TRAINER_UPDATED", "trainerId=" + profile.getId());

        return new com.jagorczyk.gymManagement.api.dto.GymDtos.TrainerProfileView(
                profile.getId(),
                profile.getEmployee().getId(),
                profile.getEmployee().getUser().getFirstName(),
                profile.getEmployee().getUser().getLastName(),
                profile.getBio(),
                profile.getSpecialization(),
                profile.getHourlyRate()
        );
    }

    @Transactional
    public void deleteTrainer(Long ownerUserId, Long gymId, Long trainerId) {
        Gym gym = requireOwnerGym(ownerUserId, gymId);
        com.jagorczyk.gymManagement.domain.PersonalTrainerProfile profile = personalTrainerProfileRepository.findById(trainerId)
                .filter(p -> p.getGym().getId().equals(gymId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono profilu trenera w tej siłowni."));

        personalTrainerProfileRepository.delete(profile);
        auditLogService.log(gym, gym.getOwnerUser(), "TRAINER_DELETED", "trainerId=" + trainerId);
    }
}
