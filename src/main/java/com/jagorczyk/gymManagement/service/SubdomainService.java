package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.repository.GymRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class SubdomainService {

    private static final String PLACEHOLDER_GYM_NAME = "Twoja Siłownia (Tymczasowa)";

    private final GymRepository gymRepository;

    public String toSubdomainSlug(String gymName) {
        if (gymName == null || gymName.trim().isEmpty()) {
            return "gym";
        }

        String base = Normalizer.normalize(gymName.toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "")
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");

        return base.isEmpty() ? "gym" : base;
    }

    public boolean isSubdomainAvailable(String subdomain, Long excludeGymId) {
        if (subdomain == null || subdomain.isBlank()) {
            return false;
        }
        if (excludeGymId == null) {
            return !gymRepository.existsBySubdomain(subdomain);
        }
        return !gymRepository.existsBySubdomainAndIdNot(subdomain, excludeGymId);
    }

    public String generateUniqueSubdomain(String gymName) {
        String base = toSubdomainSlug(gymName);

        if (gymRepository.existsBySubdomain(base)) {
            throw new IllegalArgumentException("Subdomena " + base + " jest już zajęta. Wybierz inną nazwę siłowni.");
        }

        return base;
    }

    public static boolean isPlaceholderGymName(String gymName) {
        return PLACEHOLDER_GYM_NAME.equals(gymName);
    }
}
