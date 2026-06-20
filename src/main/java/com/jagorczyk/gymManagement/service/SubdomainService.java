package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.repository.GymRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class SubdomainService {

    private final GymRepository gymRepository;

    public String generateUniqueSubdomain(String gymName) {
        if (gymName == null || gymName.trim().isEmpty()) {
            gymName = "gym";
        }
        
        // Lowercase, normalize, and remove non-alphanumeric
        String base = Normalizer.normalize(gymName.toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "")
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");

        if (base.isEmpty()) {
            base = "gym";
        }

        if (gymRepository.existsBySubdomain(base)) {
            throw new IllegalArgumentException("Subdomena " + base + " jest już zajęta. Wybierz inną nazwę siłowni.");
        }

        return base;
    }
}
