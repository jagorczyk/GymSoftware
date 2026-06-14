package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.AnalyticsDtos.*;
import com.jagorczyk.gymManagement.domain.GymPass;
import com.jagorczyk.gymManagement.domain.PassStatus;
import com.jagorczyk.gymManagement.repository.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AnalyticsService {

    private final GymRepository gymRepository;
    private final GuestRepository guestRepository;
    private final GymPassRepository passRepository;
    private final GuestCheckInRepository checkInRepository;
    private final ProductSaleRepository productSaleRepository;

    public AnalyticsService(
            GymRepository gymRepository,
            GuestRepository guestRepository,
            GymPassRepository passRepository,
            GuestCheckInRepository checkInRepository,
            ProductSaleRepository productSaleRepository
    ) {
        this.gymRepository = gymRepository;
        this.guestRepository = guestRepository;
        this.passRepository = passRepository;
        this.checkInRepository = checkInRepository;
        this.productSaleRepository = productSaleRepository;
    }

    @Transactional(readOnly = true)
    public AnalyticsDashboardDto getDashboard(Long ownerUserId, Long gymId) {
        requireOwnerGym(ownerUserId, gymId);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime monthStart = now.withDayOfMonth(1).with(LocalTime.MIN);
        LocalDateTime todayStart = now.with(LocalTime.MIN);
        LocalDateTime thirtyDaysAgo = now.minusDays(30).with(LocalTime.MIN);

        // active passes
        List<GymPass> allPasses = passRepository.findByGymId(gymId);
        long activePasses = allPasses.stream().filter(p -> p.getStatus() == PassStatus.ACTIVE).count();
        long activeGuests = allPasses.stream().filter(p -> p.getStatus() == PassStatus.ACTIVE).map(p -> p.getGuest().getId()).distinct().count();

        long newGuestsThisMonth = guestRepository.countByGymIdAndCreatedAtBetween(gymId, monthStart, now);
        long checkInsToday = checkInRepository.countByGymIdAndCheckedInAtBetween(gymId, todayStart, now);

        List<GymPass> passesThisMonth = allPasses.stream()
                .filter(p -> p.getStatus() != PassStatus.CANCELLED)
                .filter(p -> !p.getCreatedAt().isBefore(monthStart))
                .toList();

        BigDecimal revenueThisMonth = passesThisMonth.stream()
                .map(GymPass::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal productRevenueThisMonth = productSaleRepository.findAll().stream()
                .filter(ps -> ps.getGym().getId().equals(gymId) && !ps.getCreatedAt().isBefore(monthStart))
                .map(com.jagorczyk.gymManagement.domain.ProductSale::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        DashboardMetrics metrics = new DashboardMetrics(
                activePasses, activeGuests, newGuestsThisMonth, checkInsToday, revenueThisMonth, productRevenueThisMonth
        );

        // revenue over time (last 30 days)
        List<GymPass> passesLast30Days = passRepository.findByGymIdAndCreatedAtGreaterThanEqual(gymId, thirtyDaysAgo);
        Map<LocalDate, BigDecimal> revenueByDay = passesLast30Days.stream()
                .filter(p -> p.getStatus() != PassStatus.CANCELLED)
                .collect(Collectors.groupingBy(
                        p -> p.getCreatedAt().toLocalDate(),
                        Collectors.reducing(BigDecimal.ZERO, GymPass::getPrice, BigDecimal::add)
                ));

        List<ChartDataPoint> revenueOverTime = new ArrayList<>();
        for (int i = 29; i >= 0; i--) {
            LocalDate date = now.toLocalDate().minusDays(i);
            revenueOverTime.add(new ChartDataPoint(date.toString(), revenueByDay.getOrDefault(date, BigDecimal.ZERO)));
        }

        // check-ins over time
        var checkInsLast30Days = checkInRepository.findByGymIdAndCheckedInAtBetween(gymId, thirtyDaysAgo, now);
        Map<LocalDate, Long> checkInsByDay = checkInsLast30Days.stream()
                .collect(Collectors.groupingBy(
                        c -> c.getCheckedInAt().toLocalDate(),
                        Collectors.counting()
                ));

        List<ChartDataPoint> checkInsOverTime = new ArrayList<>();
        for (int i = 29; i >= 0; i--) {
            LocalDate date = now.toLocalDate().minusDays(i);
            checkInsOverTime.add(new ChartDataPoint(date.toString(), new BigDecimal(checkInsByDay.getOrDefault(date, 0L))));
        }

        List<PassTypePopularity> passTypePopularity = passRepository.countPassTypesByGymIdSince(gymId, thirtyDaysAgo);

        return new AnalyticsDashboardDto(metrics, revenueOverTime, checkInsOverTime, passTypePopularity);
    }

    private void requireOwnerGym(Long ownerUserId, Long gymId) {
        gymRepository.findById(gymId)
                .filter(g -> g.getOwnerUser().getId().equals(ownerUserId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono siłowni lub brak uprawnień właściciela."));
    }
}
