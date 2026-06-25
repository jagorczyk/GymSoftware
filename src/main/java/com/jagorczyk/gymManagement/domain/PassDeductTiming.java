package com.jagorczyk.gymManagement.domain;

public enum PassDeductTiming {
    CHECK_IN,
    CHECK_OUT;

    public String labelPl() {
        return switch (this) {
            case CHECK_IN -> "Przy wejściu na salę";
            case CHECK_OUT -> "Przy wyjściu z sali";
        };
    }
}
