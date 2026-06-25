package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.GymDtos.CreateEmployeeRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.ImportEmployeesRequest;
import com.jagorczyk.gymManagement.api.dto.GymDtos.ImportEmployeesResult;
import com.jagorczyk.gymManagement.api.dto.GymDtos.OwnerOrganizationSettingsView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.UpdateOwnerOrganizationSettingsRequest;
import com.jagorczyk.gymManagement.domain.EmployeePermission;
import com.jagorczyk.gymManagement.domain.Gym;
import com.jagorczyk.gymManagement.domain.OwnerSettings;
import com.jagorczyk.gymManagement.domain.PassDeductTiming;
import com.jagorczyk.gymManagement.domain.User;
import com.jagorczyk.gymManagement.repository.GymRepository;
import com.jagorczyk.gymManagement.repository.OwnerSettingsRepository;
import com.jagorczyk.gymManagement.repository.UserRepository;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OwnerSettingsService {
    private final OwnerSettingsRepository ownerSettingsRepository;
    private final UserRepository userRepository;
    private final GymRepository gymRepository;
    private final OwnerService ownerService;

    public OwnerSettingsService(
            OwnerSettingsRepository ownerSettingsRepository,
            UserRepository userRepository,
            GymRepository gymRepository,
            @Lazy OwnerService ownerService
    ) {
        this.ownerSettingsRepository = ownerSettingsRepository;
        this.userRepository = userRepository;
        this.gymRepository = gymRepository;
        this.ownerService = ownerService;
    }

    @Transactional(readOnly = true)
    public OwnerOrganizationSettingsView getSettings(Long ownerUserId) {
        OwnerSettings settings = getOrCreate(ownerUserId);
        return toView(settings);
    }

    @Transactional
    public OwnerOrganizationSettingsView updateSettings(Long ownerUserId, UpdateOwnerOrganizationSettingsRequest request) {
        OwnerSettings settings = getOrCreate(ownerUserId);
        settings.setPassDeductTiming(request.passDeductTiming());
        Set<EmployeePermission> optional = request.defaultEmployeePermissions() == null
                ? Set.of()
                : request.defaultEmployeePermissions().stream()
                        .filter(EmployeePermission.optionalPermissions()::contains)
                        .collect(Collectors.toSet());
        settings.setDefaultEmployeePermissions(new HashSet<>(optional));
        settings.setUpdatedAt(java.time.LocalDateTime.now());
        return toView(ownerSettingsRepository.save(settings));
    }

    @Transactional(readOnly = true)
    public PassDeductTiming getPassDeductTiming(Long ownerUserId) {
        return getOrCreate(ownerUserId).getPassDeductTiming();
    }

    @Transactional(readOnly = true)
    public Set<EmployeePermission> getDefaultOptionalPermissions(Long ownerUserId) {
        return new HashSet<>(getOrCreate(ownerUserId).getDefaultEmployeePermissions());
    }

    @Transactional
    public ImportEmployeesResult importEmployees(Long ownerUserId, ImportEmployeesRequest request) {
        List<Gym> ownerGyms = gymRepository.findByOwnerUserId(ownerUserId);
        Map<String, Gym> gymsByName = ownerGyms.stream()
                .collect(Collectors.toMap(g -> g.getName().toLowerCase(Locale.ROOT), g -> g, (a, b) -> a));
        Set<EmployeePermission> ownerDefaults = getDefaultOptionalPermissions(ownerUserId);

        int created = 0;
        int skipped = 0;
        List<String> errors = new ArrayList<>();

        String[] lines = request.csv().split("\\r?\\n");
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isEmpty()) {
                continue;
            }
            if (i == 0 && line.toLowerCase(Locale.ROOT).startsWith("email")) {
                continue;
            }
            String[] parts = Arrays.stream(line.split(",", -1))
                    .map(String::trim)
                    .toArray(String[]::new);
            if (parts.length < 5) {
                errors.add("Wiersz " + (i + 1) + ": oczekiwano co najmniej 5 kolumn (email,hasło,imię,nazwisko,siłownia)");
                skipped++;
                continue;
            }
            String email = parts[0];
            String password = parts[1];
            String firstName = parts[2];
            String lastName = parts[3];
            String gymName = parts[4];
            String permissionsRaw = parts.length > 5 ? parts[5] : "";

            Gym gym = gymsByName.get(gymName.toLowerCase(Locale.ROOT));
            if (gym == null) {
                errors.add("Wiersz " + (i + 1) + ": nie znaleziono siłowni \"" + gymName + "\"");
                skipped++;
                continue;
            }
            Set<EmployeePermission> permissions = parsePermissions(permissionsRaw, ownerDefaults);
            try {
                ownerService.createEmployee(
                        ownerUserId,
                        gym.getId(),
                        new CreateEmployeeRequest(email, password, firstName, lastName, permissions, null, null)
                );
                created++;
            } catch (IllegalArgumentException ex) {
                errors.add("Wiersz " + (i + 1) + " (" + email + "): " + ex.getMessage());
                skipped++;
            }
        }
        return new ImportEmployeesResult(created, skipped, errors);
    }

    private Set<EmployeePermission> parsePermissions(String raw, Set<EmployeePermission> ownerDefaults) {
        Set<EmployeePermission> resolved = new HashSet<>(ownerDefaults);
        if (raw == null || raw.isBlank()) {
            return resolved;
        }
        for (String token : raw.split("[|;]")) {
            String trimmed = token.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            try {
                EmployeePermission permission = EmployeePermission.valueOf(trimmed.toUpperCase(Locale.ROOT));
                if (EmployeePermission.optionalPermissions().contains(permission)) {
                    resolved.add(permission);
                }
            } catch (IllegalArgumentException ignored) {
                // skip unknown permission tokens
            }
        }
        return resolved;
    }

    private OwnerSettings getOrCreate(Long ownerUserId) {
        return ownerSettingsRepository.findById(ownerUserId).orElseGet(() -> {
            User owner = userRepository.findById(ownerUserId)
                    .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono właściciela."));
            OwnerSettings settings = new OwnerSettings();
            settings.setOwnerUser(owner);
            settings.setPassDeductTiming(PassDeductTiming.CHECK_IN);
            settings.setDefaultEmployeePermissions(EnumSet.noneOf(EmployeePermission.class));
            return ownerSettingsRepository.save(settings);
        });
    }

    private OwnerOrganizationSettingsView toView(OwnerSettings settings) {
        List<String> permissions = settings.getDefaultEmployeePermissions().stream()
                .map(Enum::name)
                .sorted()
                .toList();
        return new OwnerOrganizationSettingsView(settings.getPassDeductTiming(), permissions);
    }
}
