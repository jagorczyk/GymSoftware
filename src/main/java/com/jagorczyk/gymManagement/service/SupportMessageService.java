package com.jagorczyk.gymManagement.service;

import com.jagorczyk.gymManagement.api.dto.SupportMessageDtos.CreateSupportThreadRequest;
import com.jagorczyk.gymManagement.api.dto.SupportMessageDtos.ReplySupportMessageRequest;
import com.jagorczyk.gymManagement.api.dto.SupportMessageDtos.SupportMessageView;
import com.jagorczyk.gymManagement.api.dto.SupportMessageDtos.SupportThreadDetail;
import com.jagorczyk.gymManagement.api.dto.SupportMessageDtos.SupportThreadSummary;
import com.jagorczyk.gymManagement.domain.EmployeePermission;
import com.jagorczyk.gymManagement.domain.Guest;
import com.jagorczyk.gymManagement.domain.Gym;
import com.jagorczyk.gymManagement.domain.Role;
import com.jagorczyk.gymManagement.domain.SupportMessage;
import com.jagorczyk.gymManagement.domain.SupportMessageSenderSide;
import com.jagorczyk.gymManagement.domain.SupportMessageThread;
import com.jagorczyk.gymManagement.domain.SupportThreadStatus;
import com.jagorczyk.gymManagement.domain.User;
import com.jagorczyk.gymManagement.repository.GuestRepository;
import com.jagorczyk.gymManagement.repository.GymRepository;
import com.jagorczyk.gymManagement.repository.SupportMessageRepository;
import com.jagorczyk.gymManagement.repository.SupportMessageThreadRepository;
import com.jagorczyk.gymManagement.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SupportMessageService {
    private final SupportMessageThreadRepository threadRepository;
    private final SupportMessageRepository messageRepository;
    private final GuestRepository guestRepository;
    private final GymRepository gymRepository;
    private final UserRepository userRepository;
    private final EmployeePermissionService employeePermissionService;

    public SupportMessageService(
            SupportMessageThreadRepository threadRepository,
            SupportMessageRepository messageRepository,
            GuestRepository guestRepository,
            GymRepository gymRepository,
            UserRepository userRepository,
            EmployeePermissionService employeePermissionService
    ) {
        this.threadRepository = threadRepository;
        this.messageRepository = messageRepository;
        this.guestRepository = guestRepository;
        this.gymRepository = gymRepository;
        this.userRepository = userRepository;
        this.employeePermissionService = employeePermissionService;
    }

    @Transactional(readOnly = true)
    public List<SupportThreadSummary> listClientThreads(Long userId) {
        return threadRepository.findByGuest_User_IdOrderByUpdatedAtDesc(userId).stream()
                .map(thread -> toSummary(thread, SupportMessageSenderSide.CLIENT))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SupportThreadSummary> listClientThreadsForGym(Long userId, Long gymId) {
        requireClientGuest(userId, gymId);
        return threadRepository.findByGuest_User_IdAndGym_IdOrderByUpdatedAtDesc(userId, gymId).stream()
                .map(thread -> toSummary(thread, SupportMessageSenderSide.CLIENT))
                .toList();
    }

    @Transactional
    public SupportThreadDetail createThread(Long userId, Long gymId, CreateSupportThreadRequest request) {
        Guest guest = requireClientGuest(userId, gymId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono użytkownika."));

        SupportMessageThread thread = new SupportMessageThread();
        thread.setGym(guest.getGym());
        thread.setGuest(guest);
        thread.setSubject(request.subject().trim());
        thread.setStatus(SupportThreadStatus.OPEN);
        thread.setClientLastReadAt(LocalDateTime.now());
        thread = threadRepository.save(thread);

        addMessage(thread, user, SupportMessageSenderSide.CLIENT, request.body().trim());
        return getClientThread(userId, gymId, thread.getId());
    }

    @Transactional
    public SupportThreadDetail getClientThread(Long userId, Long gymId, Long threadId) {
        SupportMessageThread thread = requireClientThread(userId, gymId, threadId);
        thread.setClientLastReadAt(LocalDateTime.now());
        threadRepository.save(thread);
        return toDetail(thread);
    }

    @Transactional
    public SupportThreadDetail replyAsClient(Long userId, Long gymId, Long threadId, ReplySupportMessageRequest request) {
        SupportMessageThread thread = requireClientThread(userId, gymId, threadId);
        if (thread.getStatus() == SupportThreadStatus.CLOSED) {
            throw new IllegalArgumentException("Ta rozmowa została zamknięta. Otwórz nową wiadomość, jeśli potrzebujesz pomocy.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono użytkownika."));
        addMessage(thread, user, SupportMessageSenderSide.CLIENT, request.body().trim());
        thread.setClientLastReadAt(LocalDateTime.now());
        return toDetail(thread);
    }

    @Transactional(readOnly = true)
    public List<SupportThreadSummary> listStaffThreads(User user, Long gymId) {
        requireStaffAccess(user, gymId);
        return threadRepository.findStaffThreadsByGymId(gymId).stream()
                .map(thread -> toSummary(thread, SupportMessageSenderSide.STAFF))
                .toList();
    }

    @Transactional(readOnly = true)
    public int getStaffUnreadCount(User user, Long gymId) {
        requireStaffAccess(user, gymId);
        return (int) messageRepository.countUnreadForStaffByGymId(gymId, SupportMessageSenderSide.CLIENT);
    }

    @Transactional
    public SupportThreadDetail getStaffThread(User user, Long gymId, Long threadId) {
        requireStaffAccess(user, gymId);
        SupportMessageThread thread = threadRepository.findByIdAndGymId(threadId, gymId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono rozmowy."));
        thread.setStaffLastReadAt(LocalDateTime.now());
        threadRepository.save(thread);
        return toDetail(thread);
    }

    @Transactional
    public SupportThreadDetail replyAsStaff(User user, Long gymId, Long threadId, ReplySupportMessageRequest request) {
        requireStaffAccess(user, gymId);
        SupportMessageThread thread = threadRepository.findByIdAndGymId(threadId, gymId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono rozmowy."));
        if (thread.getStatus() == SupportThreadStatus.CLOSED) {
            thread.setStatus(SupportThreadStatus.OPEN);
        }
        addMessage(thread, user, SupportMessageSenderSide.STAFF, request.body().trim());
        thread.setStaffLastReadAt(LocalDateTime.now());
        return toDetail(thread);
    }

    @Transactional
    public SupportThreadDetail closeThread(User user, Long gymId, Long threadId) {
        requireStaffAccess(user, gymId);
        SupportMessageThread thread = threadRepository.findByIdAndGymId(threadId, gymId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono rozmowy."));
        thread.setStatus(SupportThreadStatus.CLOSED);
        thread.setUpdatedAt(LocalDateTime.now());
        threadRepository.save(thread);
        return toDetail(thread);
    }

    @Transactional
    public SupportThreadDetail reopenThread(User user, Long gymId, Long threadId) {
        requireStaffAccess(user, gymId);
        SupportMessageThread thread = threadRepository.findByIdAndGymId(threadId, gymId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono rozmowy."));
        thread.setStatus(SupportThreadStatus.OPEN);
        thread.setUpdatedAt(LocalDateTime.now());
        threadRepository.save(thread);
        return toDetail(thread);
    }

    private void addMessage(
            SupportMessageThread thread,
            User sender,
            SupportMessageSenderSide side,
            String body
    ) {
        if (body.isBlank()) {
            throw new IllegalArgumentException("Treść wiadomości nie może być pusta.");
        }
        SupportMessage message = new SupportMessage();
        message.setThread(thread);
        message.setSenderUser(sender);
        message.setSenderSide(side);
        message.setBody(body);
        messageRepository.save(message);

        thread.setUpdatedAt(LocalDateTime.now());
        threadRepository.save(thread);
    }

    private Guest requireClientGuest(Long userId, Long gymId) {
        return guestRepository.findByUserIdAndGymId(userId, gymId)
                .orElseThrow(() -> new IllegalArgumentException("Nie jesteś klientem tej siłowni."));
    }

    private SupportMessageThread requireClientThread(Long userId, Long gymId, Long threadId) {
        return threadRepository.findByIdAndGuest_User_IdAndGym_Id(threadId, userId, gymId)
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono rozmowy."));
    }

    private void requireStaffAccess(User user, Long gymId) {
        if (user.getRole() == Role.OWNER) {
            requireOwnerGym(user.getId(), gymId);
            return;
        }
        if (user.getRole() == Role.EMPLOYEE) {
            employeePermissionService.requirePermission(user, gymId, EmployeePermission.MANAGE_SUPPORT);
            return;
        }
        throw new IllegalArgumentException("Brak uprawnień do skrzynki wiadomości.");
    }

    private Gym requireOwnerGym(Long ownerUserId, Long gymId) {
        return gymRepository.findById(gymId)
                .filter(g -> g.getOwnerUser().getId().equals(ownerUserId))
                .orElseThrow(() -> new IllegalArgumentException("Nie znaleziono siłowni lub brak uprawnień właściciela."));
    }

    private SupportThreadSummary toSummary(SupportMessageThread thread, SupportMessageSenderSide viewerSide) {
        List<SupportMessage> messages = messageRepository.findByThreadIdOrderByCreatedAtAsc(thread.getId());
        String preview = messages.isEmpty() ? "" : messages.get(messages.size() - 1).getBody();
        if (preview.length() > 120) {
            preview = preview.substring(0, 117) + "...";
        }

        LocalDateTime lastRead = viewerSide == SupportMessageSenderSide.STAFF
                ? thread.getStaffLastReadAt()
                : thread.getClientLastReadAt();
        SupportMessageSenderSide unreadFrom = viewerSide == SupportMessageSenderSide.STAFF
                ? SupportMessageSenderSide.CLIENT
                : SupportMessageSenderSide.STAFF;
        int unread = countUnreadForViewer(thread.getId(), unreadFrom, lastRead);

        Guest guest = thread.getGuest();
        return new SupportThreadSummary(
                thread.getId(),
                thread.getGym().getId(),
                thread.getGym().getName(),
                guest.getId(),
                guest.getFirstName() + " " + guest.getLastName(),
                guest.getEmail(),
                thread.getSubject(),
                thread.getStatus().name(),
                preview,
                thread.getUpdatedAt().toString(),
                unread
        );
    }

    private SupportThreadDetail toDetail(SupportMessageThread thread) {
        List<SupportMessageView> messages = messageRepository.findThreadMessagesWithDetails(thread.getId())
                .stream()
                .map(msg -> toMessageView(msg, thread.getGuest()))
                .toList();
        Guest guest = thread.getGuest();
        return new SupportThreadDetail(
                thread.getId(),
                thread.getGym().getId(),
                thread.getGym().getName(),
                guest.getId(),
                guest.getFirstName() + " " + guest.getLastName(),
                guest.getEmail(),
                thread.getSubject(),
                thread.getStatus().name(),
                thread.getCreatedAt().toString(),
                thread.getUpdatedAt().toString(),
                messages
        );
    }

    private int countUnreadForViewer(
            Long threadId,
            SupportMessageSenderSide unreadFrom,
            LocalDateTime lastRead
    ) {
        if (lastRead == null) {
            return (int) messageRepository.countByThreadIdAndSenderSide(threadId, unreadFrom);
        }
        return (int) messageRepository.countUnreadSince(threadId, unreadFrom, lastRead);
    }

    private SupportMessageView toMessageView(SupportMessage message, Guest threadGuest) {
        User sender = message.getSenderUser();
        String senderName = sender.getEmail();
        if (message.getSenderSide() == SupportMessageSenderSide.CLIENT) {
            senderName = threadGuest.getFirstName() + " " + threadGuest.getLastName();
        }
        return new SupportMessageView(
                message.getId(),
                sender.getId(),
                senderName,
                message.getSenderSide().name(),
                message.getBody(),
                message.getCreatedAt().toString()
        );
    }
}
