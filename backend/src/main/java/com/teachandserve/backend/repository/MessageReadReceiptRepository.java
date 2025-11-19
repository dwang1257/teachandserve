package com.teachandserve.backend.repository;

import com.teachandserve.backend.model.MessageReadReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageReadReceiptRepository extends JpaRepository<MessageReadReceipt, Long> {

    /**
     * Find a read receipt for a specific message and user.
     */
    Optional<MessageReadReceipt> findByMessageIdAndUserId(Long messageId, Long userId);

    /**
     * Find all read receipts for messages in a conversation by a specific user.
     */
    @Query("SELECT mrr FROM MessageReadReceipt mrr " +
           "WHERE mrr.message.conversation.id = :conversationId " +
           "AND mrr.user.id = :userId")
    List<MessageReadReceipt> findByConversationIdAndUserId(@Param("conversationId") Long conversationId,
                                                            @Param("userId") Long userId);

    /**
     * Check if a user has read a specific message.
     */
    @Query("SELECT CASE WHEN COUNT(mrr) > 0 THEN true ELSE false END " +
           "FROM MessageReadReceipt mrr " +
           "WHERE mrr.message.id = :messageId " +
           "AND mrr.user.id = :userId")
    boolean hasUserReadMessage(@Param("messageId") Long messageId,
                               @Param("userId") Long userId);
}
