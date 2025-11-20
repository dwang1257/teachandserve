package com.teachandserve.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public interface ConversationListDTO {
    Long getConversationId();
    LocalDateTime getConversationCreatedAt();
    LocalDateTime getConversationUpdatedAt();
    Long getParticipantUserId();
    String getParticipantEmail();
    String getParticipantFirstName();
    Long getLastMessageId();
    String getLastMessageBody();
    LocalDateTime getLastMessageCreatedAt();
    String getLastMessageSenderEmail();
    long getUnreadCount();

    default ConversationResponse toResponse() {
        ParticipantDto participant = new ParticipantDto(
            getParticipantUserId(),
            getParticipantFirstName() != null ? getParticipantFirstName() : getParticipantEmail(),
            getParticipantEmail(),
            null
        );

        MessageResponse lastMessage = null;
        if (getLastMessageId() != null) {
            lastMessage = new MessageResponse(
                getLastMessageId(),
                getConversationId(),
                null, // senderId not strictly needed for preview
                getLastMessageSenderEmail(),
                getLastMessageBody(),
                getLastMessageCreatedAt(),
                null,
                null,
                List.of()
            );
        }

        return new ConversationResponse(
            getConversationId(),
            List.of(participant),
            lastMessage,
            getUnreadCount(),
            getConversationCreatedAt(),
            getConversationUpdatedAt()
        );
    }
}

