package com.teachandserve.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class ConversationResponse {

    private Long id;
    private List<ParticipantDto> participants;
    private MessageResponse lastMessage;
    private long unreadCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ConversationResponse() {}

    public ConversationResponse(Long id, List<ParticipantDto> participants,
                               MessageResponse lastMessage, long unreadCount,
                               LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.participants = participants;
        this.lastMessage = lastMessage;
        this.unreadCount = unreadCount;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public List<ParticipantDto> getParticipants() {
        return participants;
    }

    public void setParticipants(List<ParticipantDto> participants) {
        this.participants = participants;
    }

    public MessageResponse getLastMessage() {
        return lastMessage;
    }

    public void setLastMessage(MessageResponse lastMessage) {
        this.lastMessage = lastMessage;
    }

    public long getUnreadCount() {
        return unreadCount;
    }

    public void setUnreadCount(long unreadCount) {
        this.unreadCount = unreadCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
