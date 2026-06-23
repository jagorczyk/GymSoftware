package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.SupportMessageThread;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SupportMessageThreadRepository extends JpaRepository<SupportMessageThread, Long> {
    @Query("""
            SELECT t FROM SupportMessageThread t
            JOIN FETCH t.gym
            JOIN FETCH t.guest
            WHERE t.gym.id = :gymId
            ORDER BY t.updatedAt DESC
            """)
    List<SupportMessageThread> findStaffThreadsByGymId(@Param("gymId") Long gymId);

    List<SupportMessageThread> findByGymIdOrderByUpdatedAtDesc(Long gymId);

    List<SupportMessageThread> findByGuest_User_IdOrderByUpdatedAtDesc(Long userId);

    List<SupportMessageThread> findByGuest_User_IdAndGym_IdOrderByUpdatedAtDesc(Long userId, Long gymId);

    Optional<SupportMessageThread> findByIdAndGymId(Long id, Long gymId);

    Optional<SupportMessageThread> findByIdAndGuest_User_IdAndGym_Id(Long id, Long userId, Long gymId);
}
