package com.teachandserve.backend.repository;

import com.teachandserve.backend.model.Message;
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
