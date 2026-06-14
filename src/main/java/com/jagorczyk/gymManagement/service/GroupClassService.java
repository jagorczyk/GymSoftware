package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.domain.*;
import com.jagorczyk.gymManagement.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class GroupClassService {

    private final GroupClassRepository classRepository;
    private final ClassReservationRepository reservationRepository;
    private final EmployeeRepository employeeRepository;
    private final GuestRepository guestRepository;
    private final GymPassRepository gymPassRepository;
    private final ClassRatingRepository ratingRepository;

    public GroupClassService(
            GroupClassRepository classRepository,
            ClassReservationRepository reservationRepository,
            EmployeeRepository employeeRepository,
            GuestRepository guestRepository,
            GymPassRepository gymPassRepository,
            ClassRatingRepository ratingRepository) {
        this.classRepository = classRepository;
        this.reservationRepository = reservationRepository;
        this.employeeRepository = employeeRepository;
        this.guestRepository = guestRepository;
        this.gymPassRepository = gymPassRepository;
        this.ratingRepository = ratingRepository;
    }

    public List<GroupClass> getClasses(Long gymId, LocalDateTime from, LocalDateTime to) {
        return classRepository.findByGymIdAndStartTimeBetweenOrderByStartTimeAsc(gymId, from, to);
    }

    public GroupClass getClassById(Long gymId, Long classId) {
        return classRepository.findByIdAndGymId(classId, gymId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono zajęć"));
    }

    @Transactional
    public GroupClass createClass(Long gymId, Long instructorId, String name, String description, LocalDateTime startTime, LocalDateTime endTime, Integer capacity) {
        Employee instructor = employeeRepository.findByIdAndGymId(instructorId, gymId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono instruktora"));

        GroupClass newClass = new GroupClass(instructor.getGym(), instructor, name, description, startTime, endTime, capacity);
        return classRepository.save(newClass);
    }

    @Transactional
    public GroupClass updateClass(Long gymId, Long classId, Long instructorId, String name, String description, LocalDateTime startTime, LocalDateTime endTime, Integer capacity) {
        GroupClass groupClass = getClassById(gymId, classId);

        if (!groupClass.getInstructor().getId().equals(instructorId)) {
            Employee instructor = employeeRepository.findByIdAndGymId(instructorId, gymId)
                    .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono instruktora"));
            groupClass.setInstructor(instructor);
        }

        groupClass.setName(name);
        groupClass.setDescription(description);
        groupClass.setStartTime(startTime);
        groupClass.setEndTime(endTime);
        
        long activeReservations = classRepository.countActiveReservations(classId);
        if (capacity < activeReservations) {
            throw new IllegalArgumentException("Nie można zmniejszyć pojemności poniżej liczby obecnych rezerwacji (" + activeReservations + ")");
        }
        groupClass.setCapacity(capacity);

        return classRepository.save(groupClass);
    }

    @Transactional
    public void deleteClass(Long gymId, Long classId) {
        GroupClass groupClass = getClassById(gymId, classId);
        classRepository.delete(groupClass);
    }

    @Transactional
    public void bookClass(Long gymId, Long classId, Long guestId) {
        GroupClass groupClass = classRepository.findByIdAndGymId(classId, gymId)
                .orElseThrow(() -> new IllegalArgumentException("Zajęcia nie istnieją w tej siłowni"));

        Guest guest = guestRepository.findById(guestId)
                .orElseThrow(() -> new IllegalArgumentException("Gość nie istnieje"));
        if (!guest.getGym().getId().equals(gymId)) {
            throw new IllegalArgumentException("Gość nie należy do tej siłowni");
        }

        boolean hasPass = gymPassRepository.findByGuestId(guest.getId()).stream()
                .anyMatch(p -> p.getStatus() == com.jagorczyk.gymManagement.domain.PassStatus.ACTIVE);
        if (!hasPass) {
            throw new IllegalArgumentException("Musisz mieć aktywny karnet, aby zapisać się na zajęcia");
        }

        reservationRepository.findByGroupClassIdAndGuestId(classId, guestId)
                .ifPresent(r -> {
                    if (r.getStatus() != ClassReservationStatus.CANCELLED) {
                        throw new IllegalArgumentException("Jesteś już zapisany na te zajęcia (status: " + r.getStatus() + ").");
                    }
                });

        long activeReservations = classRepository.countActiveReservations(classId);
        ClassReservationStatus targetStatus = ClassReservationStatus.RESERVED;
        if (activeReservations >= groupClass.getCapacity()) {
            targetStatus = ClassReservationStatus.WAITLISTED;
        }

        ClassReservation reservation = reservationRepository.findByGroupClassIdAndGuestId(classId, guestId)
                .orElse(new ClassReservation(groupClass, guest, targetStatus, LocalDateTime.now()));

        reservation.setStatus(targetStatus);
        reservation.setReservedAt(LocalDateTime.now());
        
        reservationRepository.save(reservation);
    }

    @Transactional
    public void cancelBooking(Long gymId, Long classId, Long guestId) {
        ClassReservation reservation = reservationRepository.findByGroupClassIdAndGuestId(classId, guestId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono rezerwacji"));

        if (reservation.getStatus() == ClassReservationStatus.CANCELLED) {
            throw new IllegalArgumentException("Rezerwacja już została anulowana");
        }

        if (LocalDateTime.now().isAfter(reservation.getGroupClass().getStartTime())) {
            throw new IllegalArgumentException("Nie można anulować rezerwacji po rozpoczęciu zajęć");
        }

        ClassReservationStatus oldStatus = reservation.getStatus();
        reservation.setStatus(ClassReservationStatus.CANCELLED);
        reservationRepository.save(reservation);

        if (oldStatus == ClassReservationStatus.RESERVED) {
            promoteFirstFromWaitlist(classId);
        }
    }

    private void promoteFirstFromWaitlist(Long classId) {
        List<ClassReservation> waitlist = reservationRepository.findByGroupClassIdAndStatusOrderByReservedAtAsc(classId, ClassReservationStatus.WAITLISTED);
        if (!waitlist.isEmpty()) {
            ClassReservation firstWaitlisted = waitlist.get(0);
            firstWaitlisted.setStatus(ClassReservationStatus.RESERVED);
            reservationRepository.save(firstWaitlisted);
        }
    }

    @Transactional
    public ClassReservation updateAttendance(Long gymId, Long classId, Long reservationId, ClassReservationStatus status) {
        GroupClass groupClass = getClassById(gymId, classId);
        ClassReservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono rezerwacji"));

        if (!reservation.getGroupClass().getId().equals(groupClass.getId())) {
            throw new IllegalArgumentException("Niezgodność danych rezerwacji");
        }

        reservation.setStatus(status);
        return reservationRepository.save(reservation);
    }
    
    public List<ClassReservation> getClassReservations(Long gymId, Long classId) {
        getClassById(gymId, classId); // ensure it exists and belongs to gym
        return reservationRepository.findByGroupClassId(classId);
    }

    public List<ClassReservation> getGuestReservations(Long gymId, Long guestId) {
        Guest guest = guestRepository.findById(guestId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono klienta"));
        if (!guest.getGym().getId().equals(gymId)) {
            throw new IllegalArgumentException("Klient nie należy do tej siłowni");
        }
        return reservationRepository.findByGuestId(guestId);
    }

    @Transactional(readOnly=true)
    public List<com.jagorczyk.gymManagement.api.dto.GymDtos.ClassRatingView> getRatingsForOwner(Long ownerUserId, Long gymId, Long classId) {
        // Validation could be added here to check if ownerUserId matches gym
        GroupClass groupClass = getClassById(gymId, classId);
        return ratingRepository.findByGroupClassIdOrderByCreatedAtDesc(classId).stream()
                .map(r -> new com.jagorczyk.gymManagement.api.dto.GymDtos.ClassRatingView(
                        r.getId(),
                        r.getGroupClass().getId(),
                        r.getGuest().getId(),
                        r.getGuest().getFirstName() + " " + r.getGuest().getLastName(),
                        r.getRating(),
                        r.getComment(),
                        r.getCreatedAt()
                )).toList();
    }

    @Transactional(readOnly=true)
    public List<com.jagorczyk.gymManagement.api.dto.GymDtos.ClassRatingSummary> getRatingsSummaryForOwner(Long ownerUserId, Long gymId) {
        List<GroupClass> classes = classRepository.findByGymIdAndStartTimeBetweenOrderByStartTimeAsc(gymId, LocalDateTime.now().minusYears(1), LocalDateTime.now().plusYears(1));
        List<com.jagorczyk.gymManagement.api.dto.GymDtos.ClassRatingSummary> summaries = new java.util.ArrayList<>();
        for (GroupClass gc : classes) {
            List<ClassRating> ratings = ratingRepository.findByGroupClassIdOrderByCreatedAtDesc(gc.getId());
            if (!ratings.isEmpty()) {
                double avg = ratings.stream().mapToInt(ClassRating::getRating).average().orElse(0.0);
                summaries.add(new com.jagorczyk.gymManagement.api.dto.GymDtos.ClassRatingSummary(
                        gc.getId(),
                        gc.getName(),
                        gc.getInstructor().getUser().getEmail(),
                        avg,
                        (long) ratings.size()
                ));
            }
        }
        return summaries.stream()
                .sorted((a, b) -> Double.compare(b.avgRating(), a.avgRating()))
                .toList();
    }
}
