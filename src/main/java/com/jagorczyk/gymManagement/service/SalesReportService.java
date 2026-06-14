package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.GymDtos.SalesByPassType;
import com.jagorczyk.gymManagement.api.dto.GymDtos.SalesReport;
import com.jagorczyk.gymManagement.api.dto.GymDtos.SalesReportDay;
import com.jagorczyk.gymManagement.domain.GymPass;
import com.jagorczyk.gymManagement.domain.PassStatus;
import com.jagorczyk.gymManagement.repository.GymPassRepository;
import com.jagorczyk.gymManagement.repository.GymRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SalesReportService {
    private final GymPassRepository gymPassRepository;
    private final GymRepository gymRepository;
    private final com.jagorczyk.gymManagement.repository.ProductSaleRepository productSaleRepository;

    public SalesReportService(GymPassRepository gymPassRepository, GymRepository gymRepository, com.jagorczyk.gymManagement.repository.ProductSaleRepository productSaleRepository) {
        this.gymPassRepository = gymPassRepository;
        this.gymRepository = gymRepository;
        this.productSaleRepository = productSaleRepository;
    }

    @Transactional(readOnly = true)
    public SalesReport salesReport(Long ownerUserId, Long gymId, LocalDate from, LocalDate to) {
        requireOwnerGym(ownerUserId, gymId);
        LocalDate rangeFrom = from != null ? from : LocalDate.now().minusDays(30);
        LocalDate rangeTo = to != null ? to : LocalDate.now();
        if (rangeTo.isBefore(rangeFrom)) {
            throw new IllegalArgumentException("Data końca raportu nie może być wcześniejsza niż data początku.");
        }

        List<GymPass> passes = gymPassRepository.findByGymId(gymId).stream()
                .filter(p -> p.getStatus() != PassStatus.CANCELLED)
                .filter(p -> !p.getStartDate().isBefore(rangeFrom) && !p.getStartDate().isAfter(rangeTo))
                .toList();

        Map<LocalDate, List<GymPass>> byDay = passes.stream()
                .collect(Collectors.groupingBy(GymPass::getStartDate, LinkedHashMap::new, Collectors.toList()));

        List<com.jagorczyk.gymManagement.domain.ProductSale> productSales = productSaleRepository.findAll().stream()
                .filter(ps -> ps.getGym().getId().equals(gymId))
                .filter(ps -> !ps.getCreatedAt().toLocalDate().isBefore(rangeFrom) && !ps.getCreatedAt().toLocalDate().isAfter(rangeTo))
                .toList();

        Map<LocalDate, List<com.jagorczyk.gymManagement.domain.ProductSale>> productSalesByDay = productSales.stream()
                .collect(Collectors.groupingBy(ps -> ps.getCreatedAt().toLocalDate(), LinkedHashMap::new, Collectors.toList()));

        List<SalesReportDay> days = new ArrayList<>();
        for (LocalDate day = rangeFrom; !day.isAfter(rangeTo); day = day.plusDays(1)) {
            List<GymPass> dayPasses = byDay.getOrDefault(day, List.of());
            List<com.jagorczyk.gymManagement.domain.ProductSale> dayProductSales = productSalesByDay.getOrDefault(day, List.of());
            
            BigDecimal passesTotal = dayPasses.stream()
                    .map(GymPass::getPrice)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal productsTotal = dayProductSales.stream()
                    .map(com.jagorczyk.gymManagement.domain.ProductSale::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                    
            BigDecimal total = passesTotal.add(productsTotal);
            days.add(new SalesReportDay(day, total, dayPasses.size() + dayProductSales.size()));
        }

        Map<String, List<GymPass>> byType = passes.stream()
                .collect(Collectors.groupingBy(GymPass::getPassType));
        List<SalesByPassType> byPassType = byType.entrySet().stream()
                .map(e -> {
                    BigDecimal total = e.getValue().stream()
                            .map(GymPass::getPrice)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new SalesByPassType(e.getKey(), total, e.getValue().size());
                })
                .sorted(Comparator.comparing(SalesByPassType::total).reversed())
                .toList();

        BigDecimal passesRevenue = passes.stream()
                .map(GymPass::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
                
        BigDecimal productRevenue = productSales.stream()
                .map(com.jagorczyk.gymManagement.domain.ProductSale::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
                
        BigDecimal totalRevenue = passesRevenue.add(productRevenue);

        return new SalesReport(rangeFrom, rangeTo, totalRevenue, productRevenue, passes.size(), days, byPassType);
    }

    private void requireOwnerGym(Long ownerUserId, Long gymId) {
        gymRepository.findById(gymId)
                .filter(g -> g.getOwnerUser().getId().equals(ownerUserId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono siłowni lub brak uprawnień właściciela."));
    }
}
