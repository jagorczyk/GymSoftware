package com.jagorczyk.gymManagement.domain;

public enum WorkScheduleEntryType {
    SHIFT,
    VACATION,
    SICK_LEAVE,
    DAY_OFF,
    TRAINING,
    OTHER;

    public String labelPl() {
        return switch (this) {
            case SHIFT -> "Zmiana / praca";
            case VACATION -> "Urlop";
            case SICK_LEAVE -> "Zwolnienie";
            case DAY_OFF -> "Wolne";
            case TRAINING -> "Szkolenie";
            case OTHER -> "Inne";
        };
    }

    public String colorKey() {
        return switch (this) {
            case SHIFT -> "emerald";
            case VACATION -> "amber";
            case SICK_LEAVE -> "red";
            case DAY_OFF -> "slate";
            case TRAINING -> "violet";
            case OTHER -> "blue";
        };
    }
}
