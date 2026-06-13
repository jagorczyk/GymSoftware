package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.ClassRating;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ClassRatingRepository extends JpaRepository<ClassRating, Long> {
    List<ClassRating> findByGroupClassId(Long classId);
    Optional<ClassRating> findByGroupClassIdAndGuestId(Long classId, Long guestId);
    List<ClassRating> findByGroupClassGymId(Long gymId);
}
