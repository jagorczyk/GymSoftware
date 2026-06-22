package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.Guest;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GuestRepository extends JpaRepository<Guest, Long> {
    List<Guest> findByGymId(Long gymId);

    @Query("""
            SELECT g FROM Guest g
            WHERE g.gym.id = :gymId
            AND (
                :q IS NULL OR :q = ''
                OR LOWER(g.firstName) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(g.lastName) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(CONCAT(g.firstName, ' ', g.lastName)) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(g.email) LIKE LOWER(CONCAT('%', :q, '%'))
            )
            """)
    Page<Guest> searchByGymId(@Param("gymId") Long gymId, @Param("q") String q, Pageable pageable);

    long countByGymId(Long gymId);

    List<Guest> findByUserId(Long userId);

    java.util.Optional<Guest> findByUserIdAndGymId(Long userId, Long gymId);

    long countByGymIdAndCreatedAtBetween(Long gymId, java.time.LocalDateTime start, java.time.LocalDateTime end);
}
