package com.teachandserve.backend.dto;

import jakarta.validation.constraints.NotNull;

public class MarkAsReadRequest {

    @NotNull(message = "Last message ID is required")
    private Long lastMessageId;

    public MarkAsReadRequest() {}

    public MarkAsReadRequest(Long lastMessageId) {
        this.lastMessageId = lastMessageId;
    }

    public Long getLastMessageId() {
        return lastMessageId;
    }

    public void setLastMessageId(Long lastMessageId) {
        this.lastMessageId = lastMessageId;
    }
}
