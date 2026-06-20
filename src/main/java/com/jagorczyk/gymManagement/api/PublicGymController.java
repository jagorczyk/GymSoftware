package com.jagorczyk.gymManagement.api;

import com.jagorczyk.gymManagement.domain.Gym;
import com.jagorczyk.gymManagement.repository.GymRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/public/gyms")
@RequiredArgsConstructor
public class PublicGymController {

    private final GymRepository gymRepository;

    @GetMapping("/subdomain/{subdomain}")
    public ResponseEntity<?> getGymBySubdomain(@PathVariable String subdomain) {
        return gymRepository.findBySubdomain(subdomain)
                .map(gym -> ResponseEntity.ok(Map.of(
                        "id", gym.getId(),
                        "name", gym.getName(),
                        "themeColor", gym.getThemeColor(),
                        "subdomain", gym.getSubdomain()
                )))
                .orElse(ResponseEntity.notFound().build());
    }
}
