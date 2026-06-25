package com.jagorczyk.gymManagement.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "owner_settings")
public class OwnerSettings {
    @Id
    @Column(name = "owner_user_id")
    private Long ownerUserId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "owner_user_id")
    private User ownerUser;

    @Enumerated(EnumType.STRING)
    @Column(name = "pass_deduct_timing", nullable = false)
    private PassDeductTiming passDeductTiming = PassDeductTiming.CHECK_IN;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "owner_default_employee_permissions",
            joinColumns = @JoinColumn(name = "owner_user_id")
    )
    @Convert(converter = EmployeePermissionConverter.class)
    @Column(name = "permission", nullable = false, length = 50)
    private Set<EmployeePermission> defaultEmployeePermissions = new HashSet<>();

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
}
