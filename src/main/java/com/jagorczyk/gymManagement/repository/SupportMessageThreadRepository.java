package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.SupportMessageThread;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupportMessageThreadRepository extends JpaRepository<SupportMessageThread, Long> {
    List<SupportMessageThread> findByGymIdOrderByUpdatedAtDesc(Long gymId);

    List<SupportMessageThread> findByGuest_User_IdOrderByUpdatedAtDesc(Long userId);

    List<SupportMessageThread> findByGuest_User_IdAndGym_IdOrderByUpdatedAtDesc(Long userId, Long gymId);

    Optional<SupportMessageThread> findByIdAndGymId(Long id, Long gymId);

    Optional<SupportMessageThread> findByIdAndGuest_User_IdAndGym_Id(Long id, Long userId, Long gymId);
}
