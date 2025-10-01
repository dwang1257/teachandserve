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

    public MessageService(MessageRepository messageRepository,
                         ConversationRepository conversationRepository,
                         UserRepository userRepository,
                         MessageReadReceiptRepository readReceiptRepository,
                         ConversationService conversationService,
                         SimpMessagingTemplate messagingTemplate) {
        this.messageRepository = messageRepository;
        this.conversationRepository = conversationRepository;
        this.userRepository = userRepository;
        this.readReceiptRepository = readReceiptRepository;
        this.conversationService = conversationService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Send a message in a conversation with real-time publishing.
     *
     * @param conversationId Conversation ID
     * @param senderId       Sender user ID
     * @param body           Message body
     * @return MessageResponse DTO
     * @throws IllegalArgumentException if conversation not found or sender not authorized
     */
    @Transactional
    public MessageResponse sendMessage(Long conversationId, Long senderId, String body) {
        // Validate sender is participant
        if (!conversationService.isUserParticipant(conversationId, senderId)) {
            throw new IllegalArgumentException("Sender is not a participant in this conversation");
        }

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        // Create and save message
        Message message = new Message(conversation, sender, body);
        message = messageRepository.save(message);

        // Convert to DTO
        MessageResponse response = toMessageResponse(message);

        // Publish to WebSocket topic for this conversation
        publishMessageToConversation(conversationId, response);

        // Notify all participants about conversation update
        conversation.getParticipants().forEach(participant -> {
            publishConversationUpdate(participant.getUser().getId());
        });

        return response;
    }

    /**
     * Get paginated messages for a conversation.
     *
     * @param conversationId Conversation ID
     * @param userId         User ID requesting messages (for authorization)
     * @param beforeMessageId Optional message ID for pagination (get messages before this ID)
     * @param limit          Number of messages to retrieve
     * @return List of MessageResponse DTOs
     */
    public List<MessageResponse> getMessages(Long conversationId, Long userId,
                                            Long beforeMessageId, int limit) {
        // Validate user is participant
        if (!conversationService.isUserParticipant(conversationId, userId)) {
            throw new IllegalArgumentException("User is not a participant in this conversation");
        }

        Pageable pageable = PageRequest.of(0, limit);
        List<Message> messages;

        if (beforeMessageId != null) {
            messages = messageRepository.findByConversationIdBeforeMessageId(
                    conversationId, beforeMessageId, pageable);
        } else {
            messages = messageRepository.findByConversationIdOrderByCreatedAtDesc(
                    conversationId, pageable);
        }

        return messages.stream()
                .map(this::toMessageResponse)
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
        messagingTemplate.convertAndSend(
                "/topic/users." + userId + ".conversations",
                "update" // Simple update signal; client will refetch conversation list
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
     * Convert Message entity to MessageResponse DTO.
     *
     * @param message Message entity
     * @return MessageResponse DTO
     */
    private MessageResponse toMessageResponse(Message message) {
        List<Long> readBy = message.getReadReceipts().stream()
                .map(receipt -> receipt.getUser().getId())
                .collect(Collectors.toList());

        return new MessageResponse(
                message.getId(),
                message.getConversation().getId(),
                message.getSender().getId(),
                message.getSender().getEmail(), // Using email as sender name
                message.getBody(),
                message.getCreatedAt(),
                message.getEditedAt(),
                message.getDeletedAt(),
                readBy
        );
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
