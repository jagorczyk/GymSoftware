package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.GymDtos.NotificationSettingsView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.NotificationView;
import com.jagorczyk.gymManagement.api.dto.GymDtos.UpdateNotificationSettingsRequest;
import com.jagorczyk.gymManagement.domain.Gym;
import com.jagorczyk.gymManagement.domain.GymNotification;
import com.jagorczyk.gymManagement.domain.GymNotificationSettings;
import com.jagorczyk.gymManagement.domain.GymPass;
import com.jagorczyk.gymManagement.domain.PassStatus;
import com.jagorczyk.gymManagement.repository.GymNotificationRepository;
import com.jagorczyk.gymManagement.repository.GymNotificationSettingsRepository;
import com.jagorczyk.gymManagement.repository.GymPassRepository;
import com.jagorczyk.gymManagement.repository.GymRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private static final String TYPE_EXPIRING_PASS = "EXPIRING_PASS";

    private final GymRepository gymRepository;
    private final GymPassRepository gymPassRepository;
    private final GymNotificationRepository gymNotificationRepository;
    private final GymNotificationSettingsRepository gymNotificationSettingsRepository;

    @Value("${app.notifications.email.enabled:false}")
    private boolean emailEnabled;

    public NotificationService(
            GymRepository gymRepository,
            GymPassRepository gymPassRepository,
            GymNotificationRepository gymNotificationRepository,
            GymNotificationSettingsRepository gymNotificationSettingsRepository
    ) {
        this.gymRepository = gymRepository;
        this.gymPassRepository = gymPassRepository;
        this.gymNotificationRepository = gymNotificationRepository;
        this.gymNotificationSettingsRepository = gymNotificationSettingsRepository;
    }

    @Transactional(readOnly = true)
    public List<NotificationView> listNotifications(Long ownerUserId, Long gymId) {
        requireOwnerGym(ownerUserId, gymId);
        return gymNotificationRepository.findTop50ByGymIdOrderByCreatedAtDesc(gymId).stream()
                .map(this::toView)
                .toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long ownerUserId, Long gymId) {
        requireOwnerGym(ownerUserId, gymId);
        return gymNotificationRepository.countByGymIdAndReadAtIsNull(gymId);
    }

    @Transactional
    public void markRead(Long ownerUserId, Long gymId, Long notificationId) {
        requireOwnerGym(ownerUserId, gymId);
        GymNotification notification = gymNotificationRepository.findById(notificationId)
                .filter(n -> n.getGym().getId().equals(gymId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono powiadomienia."));
        notification.setReadAt(LocalDateTime.now());
        gymNotificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public NotificationSettingsView getSettings(Long ownerUserId, Long gymId) {
        Gym gym = requireOwnerGym(ownerUserId, gymId);
        return toSettingsView(settingsFor(gym));
    }

    @Transactional
    public NotificationSettingsView updateSettings(
            Long ownerUserId,
            Long gymId,
            UpdateNotificationSettingsRequest request
    ) {
        Gym gym = requireOwnerGym(ownerUserId, gymId);
        if (request.expiringPassDaysBefore() < 1 || request.expiringPassDaysBefore() > 60) {
            throw new IllegalArgumentException("Przypomnienie można ustawić od 1 do 60 dni przed wygaśnięciem.");
        }
        GymNotificationSettings settings = settingsFor(gym);
        settings.setExpiringPassEmailEnabled(request.expiringPassEmailEnabled());
        settings.setExpiringPassDaysBefore(request.expiringPassDaysBefore());
        settings.setNotificationEmail(request.notificationEmail());
        settings.setUpdatedAt(LocalDateTime.now());
        gymNotificationSettingsRepository.save(settings);
        return toSettingsView(settings);
    }

    @Transactional
    public int processExpiringPassNotifications() {
        LocalDate today = LocalDate.now();
        int created = 0;
        for (Gym gym : gymRepository.findAll()) {
            GymNotificationSettings settings = settingsFor(gym);
            LocalDate until = today.plusDays(settings.getExpiringPassDaysBefore());
            List<GymPass> expiring = gymPassRepository.findByGymIdAndStatus(gym.getId(), PassStatus.ACTIVE).stream()
                    .filter(p -> !p.getEndDate().isBefore(today) && !p.getEndDate().isAfter(until))
                    .toList();

            LocalDateTime dedupeSince = today.atStartOfDay();
            for (GymPass pass : expiring) {
                if (gymNotificationRepository.existsByGymIdAndTypeAndPassIdAndCreatedAtAfter(
                        gym.getId(), TYPE_EXPIRING_PASS, pass.getId(), dedupeSince)) {
                    continue;
                }
                long daysLeft = java.time.temporal.ChronoUnit.DAYS.between(today, pass.getEndDate());
                String guestName = pass.getGuest().getFirstName() + " " + pass.getGuest().getLastName();
                String title = "Karnet wygasa za " + daysLeft + " dni";
                String message = guestName + " — " + pass.getPassType() + ", ważny do " + pass.getEndDate();

                GymNotification notification = new GymNotification();
                notification.setGym(gym);
                notification.setType(TYPE_EXPIRING_PASS);
                notification.setTitle(title);
                notification.setMessage(message);
                notification.setGuest(pass.getGuest());
                notification.setPass(pass);
                gymNotificationRepository.save(notification);
                created++;

                if (settings.isExpiringPassEmailEnabled()
                        && settings.getNotificationEmail() != null
                        && !settings.getNotificationEmail().isBlank()) {
                    sendEmail(settings.getNotificationEmail(), title, message);
                    notification.setEmailSentAt(LocalDateTime.now());
                    gymNotificationRepository.save(notification);
                }
            }
        }
        return created;
    }

    private void sendEmail(String to, String subject, String body) {
        if (!emailEnabled) {
            log.info("[Powiadomienie e-mail — tryb dev] Do: {} | Temat: {} | {}", to, subject, body);
            return;
        }
        log.info("[E-mail] Do: {} | Temat: {} | {}", to, subject, body);
    }

    private GymNotificationSettings settingsFor(Gym gym) {
        return gymNotificationSettingsRepository.findById(gym.getId())
                .orElseGet(() -> {
                    GymNotificationSettings settings = new GymNotificationSettings();
                    settings.setGym(gym);
                    settings.setExpiringPassEmailEnabled(false);
                    settings.setExpiringPassDaysBefore(7);
                    return gymNotificationSettingsRepository.save(settings);
                });
    }

    private NotificationView toView(GymNotification n) {
        return new NotificationView(
                n.getId(),
                n.getType(),
                n.getTitle(),
                n.getMessage(),
                n.getGuest() != null ? n.getGuest().getId() : null,
                n.getPass() != null ? n.getPass().getId() : null,
                n.getCreatedAt(),
                n.getReadAt(),
                n.getEmailSentAt()
        );
    }

    private NotificationSettingsView toSettingsView(GymNotificationSettings s) {
        return new NotificationSettingsView(
                s.isExpiringPassEmailEnabled(),
                s.getExpiringPassDaysBefore(),
                s.getNotificationEmail()
        );
    }

    private Gym requireOwnerGym(Long ownerUserId, Long gymId) {
        return gymRepository.findById(gymId)
                .filter(g -> g.getOwnerUser().getId().equals(ownerUserId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono siłowni lub brak uprawnień właściciela."));
    }
}
