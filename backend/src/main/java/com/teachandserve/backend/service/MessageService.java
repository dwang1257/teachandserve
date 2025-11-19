package com.teachandserve.backend.service;

import com.teachandserve.backend.dto.MessageResponse;
import com.teachandserve.backend.model.Conversation;
import com.teachandserve.backend.model.Message;
import com.teachandserve.backend.model.MessageReadReceipt;
import com.teachandserve.backend.model.User;
import com.teachandserve.backend.repository.ConversationRepository;
import com.teachandserve.backend.repository.MessageReadReceiptRepository;
import com.teachandserve.backend.repository.MessageRepository;
import com.teachandserve.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final MessageReadReceiptRepository readReceiptRepository;
    private final ConversationService conversationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final RateLimitingService rateLimitingService;
    private final EncryptionService encryptionService;

    public MessageService(MessageRepository messageRepository,
                         ConversationRepository conversationRepository,
                         UserRepository userRepository,
                         MessageReadReceiptRepository readReceiptRepository,
                         ConversationService conversationService,
                         SimpMessagingTemplate messagingTemplate,
                         RateLimitingService rateLimitingService,
                         EncryptionService encryptionService) {
        this.messageRepository = messageRepository;
        this.conversationRepository = conversationRepository;
        this.userRepository = userRepository;
        this.readReceiptRepository = readReceiptRepository;
        this.conversationService = conversationService;
        this.messagingTemplate = messagingTemplate;
        this.rateLimitingService = rateLimitingService;
        this.encryptionService = encryptionService;
    }

    /**
     * Send a message in a conversation with real-time publishing.
     *
     * Features:
     * - Rate limiting (60 messages per minute)
     * - Message encryption (AES-256)
     * - Real-time WebSocket delivery
     * - Automatic cache invalidation
     *
     * @param conversationId Conversation ID
     * @param senderId       Sender user ID
     * @param body           Message body
     * @return MessageResponse DTO
     * @throws IllegalArgumentException if conversation not found, sender not authorized, or rate limit exceeded
     */
    @Transactional
    public MessageResponse sendMessage(Long conversationId, Long senderId, String body) {
        // 1. Validate sender is participant
        if (!conversationService.isUserParticipant(conversationId, senderId)) {
            throw new IllegalArgumentException("Sender is not a participant in this conversation");
        }

        // 2. Check rate limit
        if (!rateLimitingService.allowMessage(senderId)) {
            int remaining = rateLimitingService.getRemainingMessages(senderId);
            long resetTime = rateLimitingService.getResetTime(senderId);
            throw new IllegalArgumentException(
                    String.format("Rate limit exceeded. Remaining messages: %d, resets in: %d seconds",
                            remaining, resetTime)
            );
        }

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        // 3. Encrypt message body
        String encryptedBody = encryptionService.encrypt(body, conversationId);

        // Create and save message with encrypted content
        Message message = new Message(conversation, sender, encryptedBody);
        message = messageRepository.save(message);

        // 4. Convert to DTO with decrypted content for response
        MessageResponse response = toMessageResponse(message, conversationId);

        // 5. Publish to WebSocket topic for this conversation
        publishMessageToConversation(conversationId, response);

        // 6. Notify all participants about conversation update (optimized - single query)
        List<Long> participantIds = conversationRepository.findParticipantIdsByConversationId(conversationId);
        participantIds.forEach(this::publishConversationUpdate);

        return response;
    }

    /**
     * Get paginated messages for a conversation.
     *
     * Features:
     * - Message decryption (AES-256)
     * - Pagination support (50 messages per page)
     * - Conversation participant validation
     *
     * @param conversationId Conversation ID
     * @param userId         User ID requesting messages (for authorization)
     * @param beforeMessageId Optional message ID for pagination (get messages before this ID)
     * @param limit          Number of messages to retrieve (max 100)
     * @return List of MessageResponse DTOs with decrypted content
     */
    public List<MessageResponse> getMessages(Long conversationId, Long userId,
                                            Long beforeMessageId, int limit) {
        // Validate user is participant
        if (!conversationService.isUserParticipant(conversationId, userId)) {
            throw new IllegalArgumentException("User is not a participant in this conversation");
        }

        // Enforce limit maximum
        limit = Math.min(limit, 100);

        Pageable pageable = PageRequest.of(0, limit);
        List<Message> messages;

        if (beforeMessageId != null) {
            messages = messageRepository.findByConversationIdBeforeMessageId(
                    conversationId, beforeMessageId, pageable);
        } else {
            messages = messageRepository.findByConversationIdOrderByCreatedAtDesc(
                    conversationId, pageable);
        }

        // Decrypt messages and convert to DTOs
        return messages.stream()
                .map(msg -> toMessageResponse(msg, conversationId))
                .collect(Collectors.toList());
    }

    /**
     * Mark messages as read up to a specific message ID.
     *
     * @param conversationId  Conversation ID
     * @param userId          User ID marking messages as read
     * @param lastMessageId   Last message ID to mark as read
     */
    @Transactional
    public void markMessagesAsRead(Long conversationId, Long userId, Long lastMessageId) {
        // Validate user is participant
        if (!conversationService.isUserParticipant(conversationId, userId)) {
            throw new IllegalArgumentException("User is not a participant in this conversation");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get all messages up to lastMessageId
        List<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtDesc(
                conversationId, PageRequest.of(0, 100)); // Get recent messages

        for (Message message : messages) {
            // Only mark messages that are <= lastMessageId and not sent by this user
            if (message.getId() <= lastMessageId && !message.getSender().getId().equals(userId)) {
                // Check if already read
                if (!readReceiptRepository.hasUserReadMessage(message.getId(), userId)) {
                    MessageReadReceipt receipt = new MessageReadReceipt(message, user);
                    readReceiptRepository.save(receipt);

                    // Notify sender about read receipt
                    publishReadReceipt(message.getSender().getId(), message.getId(), userId);
                }
            }
        }

        // Notify user about conversation update (unread count changed)
        publishConversationUpdate(userId);
    }

    /**
     * Publish a message to the conversation's WebSocket topic.
     *
     * @param conversationId Conversation ID
     * @param message        MessageResponse to publish
     */
    private void publishMessageToConversation(Long conversationId, MessageResponse message) {
        messagingTemplate.convertAndSend(
                "/topic/conversations." + conversationId + ".messages",
                message
        );
    }

    /**
     * Publish a conversation update notification to a user's personal topic.
     *
     * @param userId User ID to notify
     */
    private void publishConversationUpdate(Long userId) {
        // Send as a proper JSON object to avoid parsing errors on client
        messagingTemplate.convertAndSend(
                "/topic/users." + userId + ".conversations",
                new ConversationUpdateNotification("update")
        );
    }

    /**
     * Publish a read receipt notification.
     *
     * @param recipientUserId User ID to receive the notification (message sender)
     * @param messageId       Message ID that was read
     * @param readByUserId    User ID who read the message
     */
    private void publishReadReceipt(Long recipientUserId, Long messageId, Long readByUserId) {
        messagingTemplate.convertAndSend(
                "/topic/users." + recipientUserId + ".read-receipts",
                new ReadReceiptNotification(messageId, readByUserId)
        );
    }

    /**
     * Convert Message entity to MessageResponse DTO with decrypted content.
     * Used when retrieving messages from database.
     *
     * @param message Message entity
     * @param conversationId Conversation ID for decryption
     * @return MessageResponse DTO with decrypted message body
     */
    private MessageResponse toMessageResponse(Message message, Long conversationId) {
        List<Long> readBy = message.getReadReceipts().stream()
                .map(receipt -> receipt.getUser().getId())
                .collect(Collectors.toList());

        // Decrypt message body
        String decryptedBody;
        try {
            decryptedBody = encryptionService.decrypt(message.getBody(), conversationId);
        } catch (Exception e) {
            // Fallback to encrypted body if decryption fails
            decryptedBody = "[Decryption failed]";
            System.err.println("Failed to decrypt message " + message.getId() + ": " + e.getMessage());
        }

        return new MessageResponse(
                message.getId(),
                message.getConversation().getId(),
                message.getSender().getId(),
                message.getSender().getEmail(),
                decryptedBody,
                message.getCreatedAt(),
                message.getEditedAt(),
                message.getDeletedAt(),
                readBy
        );
    }

    /**
     * Convert Message entity to MessageResponse DTO without decryption.
     * Used immediately after sending (message is already decrypted in sendMessage).
     *
     * @param message Message entity
     * @return MessageResponse DTO
     */
    private MessageResponse toMessageResponse(Message message) {
        List<Long> readBy = message.getReadReceipts().stream()
                .map(receipt -> receipt.getUser().getId())
                .collect(Collectors.toList());

        // For newly sent messages, body is already encrypted but we return as-is
        // The sendMessage method handles decryption before response
        return new MessageResponse(
                message.getId(),
                message.getConversation().getId(),
                message.getSender().getId(),
                message.getSender().getEmail(),
                message.getBody(),
                message.getCreatedAt(),
                message.getEditedAt(),
                message.getDeletedAt(),
                readBy
        );
    }

    /**
     * Inner class for conversation update notifications.
     */
    public static class ConversationUpdateNotification {
        private String type;

        public ConversationUpdateNotification(String type) {
            this.type = type;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }
    }

    /**
     * Inner class for read receipt notifications.
     */
    public static class ReadReceiptNotification {
        private Long messageId;
        private Long userId;

        public ReadReceiptNotification(Long messageId, Long userId) {
            this.messageId = messageId;
            this.userId = userId;
        }

        public Long getMessageId() {
            return messageId;
        }

        public void setMessageId(Long messageId) {
            this.messageId = messageId;
        }

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }
    }
}
