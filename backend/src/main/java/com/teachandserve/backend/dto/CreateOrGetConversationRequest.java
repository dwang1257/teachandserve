package com.teachandserve.backend.dto;

import jakarta.validation.constraints.NotNull;

public class CreateOrGetConversationRequest {

    @NotNull(message = "Peer user ID is required")
    private Long peerUserId;

    public CreateOrGetConversationRequest() {}

    public CreateOrGetConversationRequest(Long peerUserId) {
        this.peerUserId = peerUserId;
    }

    public Long getPeerUserId() {
        return peerUserId;
    }

    public void setPeerUserId(Long peerUserId) {
        this.peerUserId = peerUserId;
    }
}
