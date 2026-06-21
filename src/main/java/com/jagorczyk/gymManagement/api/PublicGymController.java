package com.jagorczyk.gymManagement.api;

import com.jagorczyk.gymManagement.domain.Gym;
import com.jagorczyk.gymManagement.repository.GymRepository;
import com.jagorczyk.gymManagement.service.SubdomainService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/public/gyms")
@RequiredArgsConstructor
public class PublicGymController {

    private final GymRepository gymRepository;
    private final SubdomainService subdomainService;

    @GetMapping("/subdomain/check")
    public ResponseEntity<Map<String, Object>> checkSubdomainAvailability(
            @RequestParam String gymName,
            @RequestParam(required = false) Long excludeGymId
    ) {
        String subdomain = subdomainService.toSubdomainSlug(gymName);
        boolean available = subdomainService.isSubdomainAvailable(subdomain, excludeGymId);
        return ResponseEntity.ok(Map.of(
                "subdomain", subdomain,
                "available", available
        ));
    }

    @GetMapping("/subdomain/{subdomain}")
    public ResponseEntity<?> getGymBySubdomain(@PathVariable String subdomain) {
        java.util.List<Gym> gyms = gymRepository.findBySubdomain(subdomain);
        if (gyms.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        java.util.List<java.util.Map<String, Object>> responseList = gyms.stream().map(gym -> {
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("id", gym.getId());
            response.put("name", gym.getName());
            response.put("address", gym.getAddress());
            response.put("city", gym.getCity());
            response.put("themeColor", gym.getThemeColor() != null ? gym.getThemeColor() : "#2155e5");
            response.put("subdomain", gym.getSubdomain());
            return response;
        }).toList();

        return ResponseEntity.ok(responseList);
    }
}
