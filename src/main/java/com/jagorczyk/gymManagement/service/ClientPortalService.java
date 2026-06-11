package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.ClientPortalDtos.*;
import com.jagorczyk.gymManagement.domain.*;
import com.jagorczyk.gymManagement.repository.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClientPortalService {

    private final GuestRepository guestRepository;
    private final GymRepository gymRepository;
    private final GymPassRepository gymPassRepository;
    private final PassTypeRepository passTypeRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;

    public ClientPortalService(
            GuestRepository guestRepository,
            GymRepository gymRepository,
            GymPassRepository gymPassRepository,
            PassTypeRepository passTypeRepository,
            UserRepository userRepository,
            AuditLogRepository auditLogRepository
    ) {
        this.guestRepository = guestRepository;
        this.gymRepository = gymRepository;
        this.gymPassRepository = gymPassRepository;
        this.passTypeRepository = passTypeRepository;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
    }

    private GroupClassService groupClassService;

    @org.springframework.beans.factory.annotation.Autowired
    public void setGroupClassService(GroupClassService groupClassService) {
        this.groupClassService = groupClassService;
    }

    private StripeService stripeService;

    // Optional setter injection to avoid circular dependency if it happens
    @org.springframework.beans.factory.annotation.Autowired
    public void setStripeService(StripeService stripeService) {
        this.stripeService = stripeService;
    }

    @Transactional(readOnly = true)
    public List<ClientGymView> getMyGyms(Long userId) {
        return guestRepository.findByUserId(userId).stream()
                .map(g -> new ClientGymView(g.getGym().getId(), g.getGym().getName(), g.getGym().getAddress()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ClientGymView> getAllGyms() {
        return gymRepository.findAll().stream()
                .map(g -> new ClientGymView(g.getId(), g.getName(), g.getAddress()))
                .toList();
    }

    @Transactional
    public ClientGymView joinGym(Long userId, JoinGymRequest request) {
        Optional<Guest> existing = guestRepository.findByUserIdAndGymId(userId, request.gymId());
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Już jesteś zapisany do tej siłowni");
        }

        Gym gym = gymRepository.findById(request.gymId())
                .orElseThrow(() -> new IllegalArgumentException("Siłownia nie istnieje"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Użytkownik nie istnieje"));

        Guest guest = new Guest();
        guest.setGym(gym);
        guest.setUser(user);
        guest.setFirstName(request.firstName());
        guest.setLastName(request.lastName());
        guest.setEmail(user.getEmail());
        guest.setPhone(request.phone());
        guestRepository.save(guest);

        return new ClientGymView(gym.getId(), gym.getName(), gym.getAddress());
    }

    @Transactional(readOnly = true)
    public ClientDashboardView getDashboard(Long userId, Long gymId) {
        Guest guest = getGuest(userId, gymId);
        List<ClientPassView> activePasses = gymPassRepository.findByGuestId(guest.getId()).stream()
                .filter(p -> p.getStatus() == PassStatus.ACTIVE)
                .map(p -> new ClientPassView(
                        p.getId(),
                        p.getPassType(),
                        p.getStatus().name(),
                        p.getStartDate(),
                        p.getEndDate(),
                        p.getPrice()
                ))
                .toList();
        return new ClientDashboardView(activePasses);
    }

    @Transactional(readOnly = true)
    public List<ClientPassTypeView> getPassTypes(Long gymId) {
        return passTypeRepository.findByGymId(gymId).stream()
                .map(pt -> new ClientPassTypeView(pt.getId(), pt.getName(), pt.getPrice(), pt.getDurationDays()))
                .toList();
    }

    @Transactional
    public PurchasePassResponse purchasePass(Long userId, Long gymId, PurchasePassRequest request) {
        Guest guest = getGuest(userId, gymId);
        PassType passType = passTypeRepository.findById(request.passTypeId())
                .orElseThrow(() -> new IllegalArgumentException("Typ karnetu nie istnieje"));

        if (!passType.getGym().getId().equals(gymId)) {
            throw new IllegalArgumentException("Ten typ karnetu nie należy do tej siłowni");
        }

        try {
            String checkoutUrl = stripeService.createCheckoutSession(passType, gymId, userId);
            return new PurchasePassResponse(checkoutUrl);
        } catch (com.stripe.exception.StripeException e) {
            throw new RuntimeException("Błąd podczas łączenia ze Stripe: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void activatePassFromStripe(Long userId, Long gymId, Long passTypeId) {
        Guest guest = getGuest(userId, gymId);
        PassType passType = passTypeRepository.findById(passTypeId)
                .orElseThrow(() -> new IllegalArgumentException("Typ karnetu nie istnieje"));

        GymPass gymPass = new GymPass();
        gymPass.setGuest(guest);
        gymPass.setGym(passType.getGym());
        gymPass.setPassType(passType.getName());
        gymPass.setStatus(PassStatus.ACTIVE);
        gymPass.setStartDate(LocalDate.now());
        gymPass.setEndDate(LocalDate.now().plusDays(passType.getDurationDays()));
        gymPass.setPrice(passType.getPrice());
        
        gymPass.setSoldByUser(null); 
        
        gymPassRepository.save(gymPass);

        AuditLog log = new AuditLog();
        log.setGym(passType.getGym());
        log.setActorUser(guest.getUser());
        log.setAction("ONLINE_PASS_PURCHASE");
        log.setPayload(String.format("Zakup karnetu online (Stripe) %s za %.2f", passType.getName(), passType.getPrice()));
        auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<com.jagorczyk.gymManagement.api.dto.GroupClassDtos.GroupClassView> getClasses(Long userId, Long gymId, java.time.LocalDateTime from, java.time.LocalDateTime to) {
        getGuest(userId, gymId); // Ensure user is a guest of this gym
        return groupClassService.getClasses(gymId, from, to).stream()
                .map(c -> new com.jagorczyk.gymManagement.api.dto.GroupClassDtos.GroupClassView(
                        c.getId(),
                        c.getInstructor().getId(),
                        c.getInstructor().getUser().getEmail(),
                        c.getName(),
                        c.getDescription(),
                        c.getStartTime(),
                        c.getEndTime(),
                        c.getCapacity(),
                        groupClassService.getClassReservations(gymId, c.getId()).stream().filter(r -> r.getStatus() != ClassReservationStatus.CANCELLED).count()
                )).toList();
    }

    @Transactional
    public void bookClass(Long userId, Long gymId, Long classId) {
        Guest guest = getGuest(userId, gymId);
        groupClassService.bookClass(gymId, classId, guest.getId());
    }

    @Transactional
    public void cancelBooking(Long userId, Long gymId, Long classId) {
        Guest guest = getGuest(userId, gymId);
        groupClassService.cancelBooking(gymId, classId, guest.getId());
    }

    private Guest getGuest(Long userId, Long gymId) {
        return guestRepository.findByUserIdAndGymId(userId, gymId)
                .orElseThrow(() -> new IllegalArgumentException("Nie jesteś zapisany do tej siłowni"));
    }
}
