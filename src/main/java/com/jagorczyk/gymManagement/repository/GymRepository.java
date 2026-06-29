package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.Gym;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GymRepository extends JpaRepository<Gym, Long> {
    List<Gym> findByOwnerUserId(Long ownerUserId);
    List<Gym> findBySubdomain(String subdomain);
    boolean existsBySubdomain(String subdomain);
    boolean existsBySubdomainAndIdNot(String subdomain, Long id);

    @EntityGraph(attributePaths = "ownerUser")
    @Query("SELECT g FROM Gym g WHERE g.id = :id")
    Optional<Gym> findByIdWithOwner(@Param("id") Long id);
}
