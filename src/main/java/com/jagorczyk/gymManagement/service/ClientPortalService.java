package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.ClientPortalDtos.*;
import com.jagorczyk.gymManagement.domain.*;
import com.jagorczyk.gymManagement.repository.*;
import com.jagorczyk.gymManagement.config.StripeProperties;
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

    private StripeProperties stripeProperties;

    @org.springframework.beans.factory.annotation.Autowired
    public void setStripeProperties(StripeProperties stripeProperties) {
        this.stripeProperties = stripeProperties;
    }

    private ClassRatingRepository classRatingRepository;
    private ClassReservationRepository classReservationRepository;
    private GroupClassRepository groupClassRepository;
    private PassFreezeRepository passFreezeRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public void setClassRatingRepository(ClassRatingRepository classRatingRepository) {
        this.classRatingRepository = classRatingRepository;
    }

    @org.springframework.beans.factory.annotation.Autowired
    public void setClassReservationRepository(ClassReservationRepository classReservationRepository) {
        this.classReservationRepository = classReservationRepository;
    }

    @org.springframework.beans.factory.annotation.Autowired
    public void setGroupClassRepository(GroupClassRepository groupClassRepository) {
        this.groupClassRepository = groupClassRepository;
    }

    @org.springframework.beans.factory.annotation.Autowired
    public void setPassFreezeRepository(PassFreezeRepository passFreezeRepository) {
        this.passFreezeRepository = passFreezeRepository;
    }

    private InvoiceService invoiceService;

    @org.springframework.beans.factory.annotation.Autowired
    public void setInvoiceService(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
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
                .filter(p -> p.getStatus() == PassStatus.ACTIVE || p.getStatus() == PassStatus.FROZEN)
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

        if (stripeProperties == null || stripeProperties.getApi().getKey() == null || 
            stripeProperties.getApi().getKey().contains("placeholder") || 
            stripeProperties.getApi().getKey().isBlank()) {
            
            String mockUrl = "http://localhost:5173/client/gyms/" + gymId + "/checkout-simulation?passTypeId=" + passType.getId();
            return new PurchasePassResponse(mockUrl);
        }

        try {
            String checkoutUrl = stripeService.createCheckoutSession(passType, gymId, userId);
            return new PurchasePassResponse(checkoutUrl);
        } catch (Exception e) {
            System.err.println("Stripe payment creation failed, using mock simulation: " + e.getMessage());
            String mockUrl = "http://localhost:5173/client/gyms/" + gymId + "/checkout-simulation?passTypeId=" + passType.getId();
            return new PurchasePassResponse(mockUrl);
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
        Guest guest = getGuest(userId, gymId);
        List<ClassReservation> guestReservations = classReservationRepository.findByGuestId(guest.getId());
        return groupClassService.getClasses(gymId, from, to).stream()
                .map(c -> {
                    String reservationStatus = guestReservations.stream()
                            .filter(r -> r.getGroupClass().getId().equals(c.getId()))
                            .map(r -> r.getStatus().name())
                            .findFirst()
                            .orElse(null);
                    return new com.jagorczyk.gymManagement.api.dto.GroupClassDtos.GroupClassView(
                            c.getId(),
                            c.getInstructor().getId(),
                            c.getInstructor().getUser().getEmail(),
                            c.getName(),
                            c.getDescription(),
                            c.getStartTime(),
                            c.getEndTime(),
                            c.getCapacity(),
                            groupClassRepository.countActiveReservations(c.getId()),
                            reservationStatus
                    );
                }).toList();
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

    @Transactional
    public void rateClass(Long userId, Long gymId, Long classId, Integer rating, String comment) {
        Guest guest = getGuest(userId, gymId);
        GroupClass groupClass = groupClassRepository.findById(classId)
                .orElseThrow(() -> new IllegalArgumentException("Zajęcia nie istnieją"));

        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Ocena musi być w przedziale 1-5");
        }

        ClassReservation reservation = classReservationRepository.findByGroupClassIdAndGuestId(classId, guest.getId())
                .orElseThrow(() -> new IllegalArgumentException("Nie posiadasz rezerwacji na te zajęcia"));

        if (reservation.getStatus() != ClassReservationStatus.ATTENDED) {
            throw new IllegalArgumentException("Możesz ocenić tylko zajęcia, w których brałeś udział (wymagana obecność)");
        }

        ClassRating classRating = classRatingRepository.findByGroupClassIdAndGuestId(classId, guest.getId())
                .orElse(new ClassRating());

        classRating.setGroupClass(groupClass);
        classRating.setGuest(guest);
        classRating.setRating(rating);
        classRating.setComment(comment);
        classRating.setCreatedAt(java.time.LocalDateTime.now());

        classRatingRepository.save(classRating);
    }

    @Transactional
    public void freezePass(Long userId, Long gymId, Long passId, java.time.LocalDate startDate, java.time.LocalDate endDate) {
        Guest guest = getGuest(userId, gymId);
        GymPass pass = gymPassRepository.findById(passId)
                .filter(p -> p.getGuest().getId().equals(guest.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono karnetu"));

        if (pass.getStatus() != PassStatus.ACTIVE) {
            throw new IllegalArgumentException("Można zamrozić tylko aktywny karnet");
        }

        java.time.LocalDate today = java.time.LocalDate.now();
        if (startDate.isBefore(today)) {
            throw new IllegalArgumentException("Data rozpoczęcia zamrożenia nie może być w przeszłości");
        }
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("Data zakończenia zamrożenia musi być po dacie rozpoczęcia");
        }
        if (endDate.isAfter(pass.getEndDate())) {
            throw new IllegalArgumentException("Zamrożenie nie może trwać dłużej niż ważność karnetu");
        }
        long duration = java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate) + 1;
        if (duration > 30) {
            throw new IllegalArgumentException("Maksymalny okres zamrożenia to 30 dni");
        }

        PassFreeze freeze = new PassFreeze();
        freeze.setGymPass(pass);
        freeze.setStartDate(startDate);
        freeze.setEndDate(endDate);
        freeze.setProcessed(false);
        passFreezeRepository.save(freeze);

        if (!today.isBefore(startDate) && !today.isAfter(endDate)) {
            pass.setStatus(PassStatus.FROZEN);
            gymPassRepository.save(pass);
        }

        AuditLog log = new AuditLog();
        log.setGym(pass.getGym());
        log.setActorUser(guest.getUser());
        log.setAction("PASS_FROZEN");
        log.setPayload(String.format("Zamrożenie karnetu %d od %s do %s", pass.getId(), startDate, endDate));
        auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public byte[] getInvoicePdf(Long userId, Long gymId, Long passId) {
        Guest guest = getGuest(userId, gymId);
        GymPass pass = gymPassRepository.findById(passId)
                .filter(p -> p.getGuest().getId().equals(guest.getId()))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono karnetu"));

        return invoiceService.generateInvoicePdf(pass);
    }

    private Guest getGuest(Long userId, Long gymId) {
        return guestRepository.findByUserIdAndGymId(userId, gymId)
                .orElseThrow(() -> new IllegalArgumentException("Nie jesteś zapisany do tej siłowni"));
    }
}
