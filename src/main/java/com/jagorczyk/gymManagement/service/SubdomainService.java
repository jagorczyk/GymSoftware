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

        String subdomain = base;
        int counter = 2;

        while (gymRepository.existsBySubdomain(subdomain)) {
            subdomain = base + counter;
            counter++;
        }

        return subdomain;
    }
}
