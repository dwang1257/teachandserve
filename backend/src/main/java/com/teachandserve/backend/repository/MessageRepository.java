package com.teachandserve.backend.repository;

import com.teachandserve.backend.dto.MessageDTO;
import com.teachandserve.backend.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    /**
     * OPTIMIZED: Get messages for a conversation using DTO projection.
     * Reduces memory overhead and fetches sender details in one query.
     */
    @Query("""
        SELECT
            m.id as id,
            u.id as senderId,
            u.email as senderEmail,
            u.firstName as senderFirstName,
            m.body as body,
            m.createdAt as createdAt,
            m.editedAt as editedAt,
            m.deletedAt as deletedAt
        FROM Message m
        JOIN m.sender u
        WHERE m.conversation.id = :conversationId
        ORDER BY m.createdAt DESC
    """)
    Page<MessageDTO> findMessagesOptimized(@Param("conversationId") Long conversationId, Pageable pageable);

    /**
     * Find unread message IDs for a user in a conversation.
     * Used for bulk marking as read.
     */
    @Query("""
        SELECT m.id FROM Message m
        WHERE m.conversation.id = :conversationId
        AND m.sender.id <> :userId
        AND m.id <= :lastMessageId
        AND NOT EXISTS (
            SELECT 1 FROM MessageReadReceipt mrr
            WHERE mrr.message.id = m.id AND mrr.user.id = :userId
        )
    """)
    List<Long> findUnreadMessageIds(@Param("conversationId") Long conversationId,
                                   @Param("userId") Long userId,
                                   @Param("lastMessageId") Long lastMessageId);

    /**
     * Find messages for a conversation, ordered by creation time descending (newest first).
     * Uses pageable for pagination support.
     */
    @Query("SELECT m FROM Message m " +
           "WHERE m.conversation.id = :conversationId " +
           "ORDER BY m.createdAt DESC")
    List<Message> findByConversationIdOrderByCreatedAtDesc(@Param("conversationId") Long conversationId,
                                                            Pageable pageable);

    /**
     * Find messages for a conversation before a specific message (for pagination).
     * Returns messages with id < beforeMessageId, ordered by creation time descending.
     */
    @Query("SELECT m FROM Message m " +
           "WHERE m.conversation.id = :conversationId " +
           "AND m.id < :beforeMessageId " +
           "ORDER BY m.createdAt DESC")
    List<Message> findByConversationIdBeforeMessageId(@Param("conversationId") Long conversationId,
                                                       @Param("beforeMessageId") Long beforeMessageId,
                                                       Pageable pageable);

    /**
     * Find the most recent message in a conversation.
     */
    @Query("SELECT m FROM Message m " +
           "WHERE m.conversation.id = :conversationId " +
           "ORDER BY m.createdAt DESC LIMIT 1")
    Optional<Message> findLastMessageByConversationId(@Param("conversationId") Long conversationId);

    /**
     * Count unread messages for a user in a conversation.
     * A message is unread if there's no read receipt for that user.
     */
    @Query("SELECT COUNT(m) FROM Message m " +
           "WHERE m.conversation.id = :conversationId " +
           "AND m.sender.id <> :userId " +
           "AND NOT EXISTS (" +
           "  SELECT 1 FROM MessageReadReceipt mrr " +
           "  WHERE mrr.message.id = m.id " +
           "  AND mrr.user.id = :userId" +
           ")")
    long countUnreadMessages(@Param("conversationId") Long conversationId,
                             @Param("userId") Long userId);
}
