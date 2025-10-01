package com.teachandserve.backend.service;

import com.teachandserve.backend.dto.ConversationResponse;
import com.teachandserve.backend.dto.MessageResponse;
import com.teachandserve.backend.dto.ParticipantDto;
import com.teachandserve.backend.model.Conversation;
import com.teachandserve.backend.model.ConversationParticipant;
import com.teachandserve.backend.model.Message;
import com.teachandserve.backend.model.User;
import com.teachandserve.backend.repository.ConversationParticipantRepository;
import com.teachandserve.backend.repository.ConversationRepository;
import com.teachandserve.backend.repository.MessageRepository;
import com.teachandserve.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final MatchService matchService;

    public ConversationService(ConversationRepository conversationRepository,
                              ConversationParticipantRepository participantRepository,
                              UserRepository userRepository,
                              MessageRepository messageRepository,
                              MatchService matchService) {
        this.conversationRepository = conversationRepository;
        this.participantRepository = participantRepository;
        this.userRepository = userRepository;
        this.messageRepository = messageRepository;
        this.matchService = matchService;
    }

    /**
     * Get or create a 1:1 conversation between two users (idempotent).
     * Validates that users are matched before creating/returning conversation.
     *
     * @param userId     Current user ID
     * @param peerUserId Peer user ID
     * @return Conversation object
     * @throws IllegalArgumentException if users are not matched
     * @throws RuntimeException         if peer user not found
     */
    @Transactional
    public Conversation getOrCreate1to1Conversation(Long userId, Long peerUserId) {
        // Validate that users are matched
        if (!matchService.areMatched(userId, peerUserId)) {
            throw new IllegalArgumentException("Users are not matched and cannot start a conversation");
        }

        // Check if conversation already exists
        Optional<Conversation> existingConversation =
                conversationRepository.findOneToOneConversation(userId, peerUserId);

        if (existingConversation.isPresent()) {
            return existingConversation.get();
        }

        // Create new conversation
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User peerUser = userRepository.findById(peerUserId)
                .orElseThrow(() -> new RuntimeException("Peer user not found"));

        Conversation conversation = new Conversation();
        conversation = conversationRepository.save(conversation);

        // Add participants
        ConversationParticipant participant1 = new ConversationParticipant(conversation, currentUser);
        ConversationParticipant participant2 = new ConversationParticipant(conversation, peerUser);

        participantRepository.save(participant1);
        participantRepository.save(participant2);

        conversation.getParticipants().add(participant1);
        conversation.getParticipants().add(participant2);

        return conversation;
    }

    /**
     * Get all conversations for a user.
     *
     * @param userId User ID
     * @return List of conversation responses with participants, last message, and unread count
     */
    public List<ConversationResponse> getUserConversations(Long userId) {
        List<Conversation> conversations = conversationRepository.findByUserIdOrderByUpdatedAtDesc(userId);

        return conversations.stream()
                .map(conv -> toConversationResponse(conv, userId))
                .collect(Collectors.toList());
    }

    /**
     * Get a conversation by ID, with authorization check.
     *
     * @param conversationId Conversation ID
     * @param userId         User ID requesting access
     * @return Conversation
     * @throws IllegalArgumentException if conversation not found or user not authorized
     */
    public Conversation getConversation(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        if (!isUserParticipant(conversationId, userId)) {
            throw new IllegalArgumentException("User is not a participant in this conversation");
        }

        return conversation;
    }

    /**
     * Check if a user is a participant in a conversation.
     *
     * @param conversationId Conversation ID
     * @param userId         User ID
     * @return true if user is a participant
     */
    public boolean isUserParticipant(Long conversationId, Long userId) {
        return conversationRepository.isUserParticipant(conversationId, userId);
    }

    /**
     * Convert Conversation entity to ConversationResponse DTO.
     *
     * @param conversation Conversation entity
     * @param userId       Current user ID (for unread count)
     * @return ConversationResponse DTO
     */
    private ConversationResponse toConversationResponse(Conversation conversation, Long userId) {
        List<ParticipantDto> participants = conversation.getParticipants().stream()
                .map(cp -> new ParticipantDto(
                        cp.getUser().getId(),
                        cp.getUser().getEmail(), // Using email as name for now
                        cp.getUser().getEmail(),
                        null // avatarUrl not implemented yet
                ))
                .collect(Collectors.toList());

        // Get last message
        Optional<Message> lastMessage = messageRepository.findLastMessageByConversationId(conversation.getId());
        MessageResponse lastMessageDto = lastMessage.map(this::toMessageResponse).orElse(null);

        // Count unread messages
        long unreadCount = messageRepository.countUnreadMessages(conversation.getId(), userId);

        return new ConversationResponse(
                conversation.getId(),
                participants,
                lastMessageDto,
                unreadCount,
                conversation.getCreatedAt(),
                conversation.getUpdatedAt()
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
}
