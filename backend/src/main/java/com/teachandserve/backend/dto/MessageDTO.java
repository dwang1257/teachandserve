package com.teachandserve.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public interface MessageDTO {
    Long getId();
    Long getSenderId();
    String getSenderEmail();
    String getSenderFirstName();
    String getBody();
    LocalDateTime getCreatedAt();
    LocalDateTime getEditedAt();
    LocalDateTime getDeletedAt();
}

