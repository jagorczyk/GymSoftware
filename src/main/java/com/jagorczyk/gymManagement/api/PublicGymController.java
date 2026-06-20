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
