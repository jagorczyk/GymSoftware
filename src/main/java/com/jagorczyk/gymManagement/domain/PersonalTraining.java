package com.jagorczyk.gymManagement.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "personal_trainings")
@Getter
@Setter
public class PersonalTraining {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "gym_id", nullable = false)
    private Gym gym;

    @ManyToOne
    @JoinColumn(name = "client_id", nullable = false)
    private Guest client;

    @ManyToOne
    @JoinColumn(name = "trainer_id", nullable = false)
    private Employee trainer;

    private LocalDateTime scheduledAt;

    private BigDecimal price;

    private boolean isPaid;

    private String status; // e.g., SCHEDULED, CANCELLED, COMPLETED
}
