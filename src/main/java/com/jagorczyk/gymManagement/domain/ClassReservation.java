package com.jagorczyk.gymManagement.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "class_reservations")
public class ClassReservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_class_id", nullable = false)
    private GroupClass groupClass;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guest_id", nullable = false)
    private Guest guest;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClassReservationStatus status;

    @Column(nullable = false)
    private LocalDateTime reservedAt;

    public ClassReservation() {
    }

    public ClassReservation(GroupClass groupClass, Guest guest, ClassReservationStatus status, LocalDateTime reservedAt) {
        this.groupClass = groupClass;
        this.guest = guest;
        this.status = status;
        this.reservedAt = reservedAt;
    }

    public Long getId() {
        return id;
    }

    public GroupClass getGroupClass() {
        return groupClass;
    }

    public void setGroupClass(GroupClass groupClass) {
        this.groupClass = groupClass;
    }

    public Guest getGuest() {
        return guest;
    }

    public void setGuest(Guest guest) {
        this.guest = guest;
    }

    public ClassReservationStatus getStatus() {
        return status;
    }

    public void setStatus(ClassReservationStatus status) {
        this.status = status;
    }

    public LocalDateTime getReservedAt() {
        return reservedAt;
    }

    public void setReservedAt(LocalDateTime reservedAt) {
        this.reservedAt = reservedAt;
    }
}
