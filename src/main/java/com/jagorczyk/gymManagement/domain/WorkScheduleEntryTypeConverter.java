package com.jagorczyk.gymManagement.domain;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class WorkScheduleEntryTypeConverter implements AttributeConverter<WorkScheduleEntryType, String> {
    @Override
    public String convertToDatabaseColumn(WorkScheduleEntryType attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public WorkScheduleEntryType convertToEntityAttribute(String dbData) {
        return dbData == null ? null : WorkScheduleEntryType.valueOf(dbData);
    }
}
