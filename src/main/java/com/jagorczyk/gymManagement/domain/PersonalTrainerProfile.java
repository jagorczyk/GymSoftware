package com.jagorczyk.gymManagement.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "personal_trainer_profiles")
@Getter
@Setter
public class PersonalTrainerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne
    @JoinColumn(name = "gym_id", nullable = false)
    private Gym gym;

    private String bio;

    private String specialization;

    private BigDecimal hourlyRate;

    @OneToMany(mappedBy = "trainerProfile", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    private java.util.List<TrainerAvailability> availabilities = new java.util.ArrayList<>();
}
