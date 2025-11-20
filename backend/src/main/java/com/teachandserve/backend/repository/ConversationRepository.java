package com.teachandserve.backend.repository;

import com.teachandserve.backend.dto.ConversationListDTO;
import com.teachandserve.backend.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    /**
     * OPTIMIZED: Dramatically reduced queries using native SQL with projection.
     * Single query fetches conversations with last message and unread count.
     * Replaces 31+ queries (N+1 problem) with 1 efficient database call.
     */
    @Query(nativeQuery = true, value = """
        SELECT
            c.id as conversationId,
            c.created_at as conversationCreatedAt,
            c.updated_at as conversationUpdatedAt,
            u.id as participantUserId,
            u.email as participantEmail,
            u.first_name as participantFirstName,
            m.id as lastMessageId,
            m.body as lastMessageBody,
            m.created_at as lastMessageCreatedAt,
            sender.email as lastMessageSenderEmail,
            COALESCE(
                (SELECT COUNT(DISTINCT msg.id)
                 FROM messages msg
                 WHERE msg.conversation_id = c.id
                 AND msg.sender_id <> :userId
                 AND NOT EXISTS (
                     SELECT 1 FROM message_read_receipts mrr
                     WHERE mrr.message_id = msg.id AND mrr.user_id = :userId
                 )
                ), 0) as unreadCount
        FROM conversations c
        JOIN conversation_participants cp ON c.id = cp.conversation_id AND cp.user_id = :userId
        JOIN conversation_participants p ON c.id = p.conversation_id AND p.user_id <> :userId
        JOIN users u ON p.user_id = u.id
        LEFT JOIN messages m ON c.id = m.conversation_id
            AND m.id = (SELECT MAX(m2.id) FROM messages m2 WHERE m2.conversation_id = c.id)
        LEFT JOIN users sender ON m.sender_id = sender.id
        ORDER BY c.updated_at DESC
    """)
    List<ConversationListDTO> findConversationsByUserIdOptimized(@Param("userId") Long userId);

    /**
     * Find all conversations for a given user, ordered by most recently updated first.
     * Uses JOIN FETCH to avoid N+1 queries when loading participants.
     */
    @Query("SELECT DISTINCT c FROM Conversation c " +
           "JOIN FETCH c.participants cp " +
           "WHERE cp.user.id = :userId " +
           "ORDER BY c.updatedAt DESC")
    List<Conversation> findByUserIdOrderByUpdatedAtDesc(@Param("userId") Long userId);

    /**
     * Find a 1:1 conversation between two users.
     * The conversation must have exactly 2 participants: userId1 and userId2.
     */
    @Query("SELECT c FROM Conversation c " +
           "JOIN c.participants cp1 " +
           "JOIN c.participants cp2 " +
           "WHERE cp1.user.id = :userId1 " +
           "AND cp2.user.id = :userId2 " +
           "AND cp1.user.id <> cp2.user.id " +
           "AND (SELECT COUNT(cp) FROM ConversationParticipant cp WHERE cp.conversation.id = c.id) = 2")
    Optional<Conversation> findOneToOneConversation(@Param("userId1") Long userId1,
                                                     @Param("userId2") Long userId2);

    /**
     * Check if a user is a participant in a conversation.
     */
    @Query("SELECT CASE WHEN COUNT(cp) > 0 THEN true ELSE false END " +
           "FROM ConversationParticipant cp " +
           "WHERE cp.conversation.id = :conversationId " +
           "AND cp.user.id = :userId")
    boolean isUserParticipant(@Param("conversationId") Long conversationId,
                              @Param("userId") Long userId);

    /**
     * Get all participant user IDs for a conversation.
     * Optimized to avoid loading full participant objects.
     * Single query that returns only the user IDs needed.
     */
    @Query("SELECT DISTINCT p.user.id FROM ConversationParticipant p " +
           "WHERE p.conversation.id = :conversationId")
    List<Long> findParticipantIdsByConversationId(@Param("conversationId") Long conversationId);
}
