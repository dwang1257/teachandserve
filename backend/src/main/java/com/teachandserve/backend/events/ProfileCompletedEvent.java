package com.teachandserve.backend.events;

import org.springframework.context.ApplicationEvent;

public class ProfileCompletedEvent extends ApplicationEvent {
    
    private final Long userId;
    
    public ProfileCompletedEvent(Object source, Long userId) {
        super(source);
        this.userId = userId;
    }
    
    public Long getUserId() {
        return userId;
    }
}