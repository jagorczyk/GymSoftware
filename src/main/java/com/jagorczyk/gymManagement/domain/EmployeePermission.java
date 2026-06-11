package com.jagorczyk.gymManagement.domain;

import java.util.Collection;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.Set;

public enum EmployeePermission {
    VIEW_DASHBOARD,
    MANAGE_GUESTS,
    SELL_PASSES,
    MANAGE_LOCKERS,
    CREATE_LOCKERS,
    MANAGE_PASS_TYPES,
    MANAGE_SCHEDULE,
    MANAGE_WORK_SCHEDULE;

    public static Set<EmployeePermission> defaultPermissions() {
        return EnumSet.of(VIEW_DASHBOARD, MANAGE_GUESTS, SELL_PASSES, MANAGE_LOCKERS);
    }

    public static Set<EmployeePermission> optionalPermissions() {
        return EnumSet.of(MANAGE_SCHEDULE, CREATE_LOCKERS, MANAGE_PASS_TYPES, MANAGE_WORK_SCHEDULE);
    }

    public static Set<EmployeePermission> resolve(Collection<EmployeePermission> requested) {
        Set<EmployeePermission> resolved = new HashSet<>(defaultPermissions());
        if (requested != null) {
            resolved.addAll(requested);
        }
        return resolved;
    }

    public String labelPl() {
        return switch (this) {
            case VIEW_DASHBOARD -> "Podgląd panelu i obecnych klientów";
            case MANAGE_GUESTS -> "Zarządzanie klientami";
            case SELL_PASSES -> "Sprzedaż karnetów";
            case MANAGE_LOCKERS -> "Przypisywanie i odbiór szafek";
            case CREATE_LOCKERS -> "Dodawanie nowych szafek";
            case MANAGE_PASS_TYPES -> "Zarządzanie ofertą karnetów";
            case MANAGE_SCHEDULE -> "Zarządzanie terminarzem";
            case MANAGE_WORK_SCHEDULE -> "Zarządzanie grafikiem pracy";
        };
    }
}
