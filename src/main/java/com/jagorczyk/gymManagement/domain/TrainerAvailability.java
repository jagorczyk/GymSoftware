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

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "trainer_availabilities")
@Getter
@Setter
public class TrainerAvailability {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "trainer_profile_id", nullable = false)
    private PersonalTrainerProfile trainerProfile;

    private LocalDate date;

    private LocalTime startTime;

    private LocalTime endTime;

    private Integer slotDurationMinutes = 60;
}
