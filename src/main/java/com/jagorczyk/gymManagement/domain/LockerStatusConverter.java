package com.jagorczyk.gymManagement.domain;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class LockerStatusConverter implements AttributeConverter<LockerStatus, String> {
    @Override
    public String convertToDatabaseColumn(LockerStatus attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public LockerStatus convertToEntityAttribute(String dbData) {
        return dbData == null ? null : LockerStatus.valueOf(dbData);
    }
}
