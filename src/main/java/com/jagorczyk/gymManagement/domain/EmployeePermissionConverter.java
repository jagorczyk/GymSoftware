package com.jagorczyk.gymManagement.domain;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class EmployeePermissionConverter implements AttributeConverter<EmployeePermission, String> {
    @Override
    public String convertToDatabaseColumn(EmployeePermission attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public EmployeePermission convertToEntityAttribute(String dbData) {
        return dbData == null ? null : EmployeePermission.valueOf(dbData);
    }
}
