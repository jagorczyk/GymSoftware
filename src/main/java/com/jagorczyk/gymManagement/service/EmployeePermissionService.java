package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.domain.Employee;
import com.jagorczyk.gymManagement.domain.EmployeePermission;
import com.jagorczyk.gymManagement.domain.User;
import com.jagorczyk.gymManagement.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmployeePermissionService {
    private final EmployeeRepository employeeRepository;

    public EmployeePermissionService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    @Transactional(readOnly = true)
    public Employee requireEmployee(User user, Long gymId) {
        return employeeRepository.findByUserId(user.getId())
                .filter(e -> e.getGym().getId().equals(gymId))
                .orElseThrow(() -> new IllegalArgumentException("Nie masz uprawnień do tej siłowni."));
    }

    @Transactional(readOnly = true)
    public void requirePermission(User user, Long gymId, EmployeePermission permission) {
        Employee employee = requireEmployee(user, gymId);
        java.util.Set<EmployeePermission> perms = effectivePermissions(employee);
        if (!perms.contains(permission)) {
            throw new IllegalArgumentException(
                    "Brak uprawnienia: " + permission.labelPl() + ".");
        }
    }

    /**
     * Zwraca efektywne uprawnienia pracownika jako sumę uprawnień rangi
     * (jeśli ranga jest przypisana) oraz własnych uprawnień pracownika.
     * Dzięki temu uprawnienia nadane bezpośrednio pracownikowi są zawsze
     * respektowane, niezależnie od tego czy ma rangę.
     */
    @Transactional(readOnly = true)
    public java.util.Set<EmployeePermission> effectivePermissions(Employee employee) {
        if (employee.getRank() != null) {
            java.util.Set<EmployeePermission> merged = new java.util.HashSet<>(employee.getRank().getPermissions());
            merged.addAll(employee.getPermissions());
            return merged;
        }
        return employee.getPermissions();
    }

    @Transactional(readOnly = true)
    public boolean hasPermission(Long gymId, Long userId, String permissionStr) {
        try {
            EmployeePermission permission = EmployeePermission.valueOf(permissionStr);
            Employee employee = employeeRepository.findByUserId(userId)
                    .filter(e -> e.getGym().getId().equals(gymId))
                    .orElse(null);
            if (employee == null) return false;
            return effectivePermissions(employee).contains(permission);
        } catch (Exception e) {
            return false;
        }
    }
}
