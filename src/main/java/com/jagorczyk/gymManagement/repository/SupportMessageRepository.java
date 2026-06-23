package com.jagorczyk.gymManagement.repository;

import com.jagorczyk.gymManagement.domain.SupportMessage;
import com.jagorczyk.gymManagement.domain.SupportMessageSenderSide;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SupportMessageRepository extends JpaRepository<SupportMessage, Long> {
    List<SupportMessage> findByThreadIdOrderByCreatedAtAsc(Long threadId);

    @Query("""
            SELECT COUNT(m) FROM SupportMessage m
            WHERE m.thread.id = :threadId
            AND m.senderSide = :senderSide
            AND (:since IS NULL OR m.createdAt > :since)
            """)
    long countUnread(
            @Param("threadId") Long threadId,
            @Param("senderSide") SupportMessageSenderSide senderSide,
            @Param("since") LocalDateTime since
    );

    @Query("""
            SELECT COUNT(m) FROM SupportMessage m
            JOIN m.thread t
            WHERE t.gym.id = :gymId
            AND m.senderSide = :senderSide
            AND (t.staffLastReadAt IS NULL OR m.createdAt > t.staffLastReadAt)
            """)
    long countUnreadForStaffByGymId(
            @Param("gymId") Long gymId,
            @Param("senderSide") SupportMessageSenderSide senderSide
    );
}
