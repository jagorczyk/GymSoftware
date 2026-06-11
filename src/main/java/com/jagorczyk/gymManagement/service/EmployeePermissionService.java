package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.domain.Employee;
import com.jagorczyk.gymManagement.domain.EmployeePermission;
import com.jagorczyk.gymManagement.domain.User;
import com.jagorczyk.gymManagement.repository.EmployeeRepository;
import org.springframework.stereotype.Service;

@Service
public class EmployeePermissionService {
    private final EmployeeRepository employeeRepository;

    public EmployeePermissionService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    public Employee requireEmployee(User user, Long gymId) {
        return employeeRepository.findByUserId(user.getId())
                .filter(e -> e.getGym().getId().equals(gymId))
                .orElseThrow(() -> new IllegalArgumentException("Nie masz uprawnień do tej siłowni."));
    }

    public void requirePermission(User user, Long gymId, EmployeePermission permission) {
        Employee employee = requireEmployee(user, gymId);
        java.util.Set<EmployeePermission> perms = employee.getRank() != null ? employee.getRank().getPermissions() : employee.getPermissions();
        if (!perms.contains(permission)) {
            throw new IllegalArgumentException(
                    "Brak uprawnienia: " + permission.labelPl() + ".");
        }
    }

    public boolean hasPermission(Long gymId, Long userId, String permissionStr) {
        try {
            EmployeePermission permission = EmployeePermission.valueOf(permissionStr);
            Employee employee = employeeRepository.findByUserId(userId)
                    .filter(e -> e.getGym().getId().equals(gymId))
                    .orElse(null);
            if (employee == null) return false;
            java.util.Set<EmployeePermission> perms = employee.getRank() != null ? employee.getRank().getPermissions() : employee.getPermissions();
            return perms.contains(permission);
        } catch (Exception e) {
            return false;
        }
    }
}
