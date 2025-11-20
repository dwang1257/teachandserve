package com.teachandserve.backend.dto;

import com.teachandserve.backend.model.Role;

public class AuthResponse {
    
    private String token;
    private UserInfo user;
    
    public AuthResponse() {}
    
    public AuthResponse(String token, UserInfo user) {
        this.token = token;
        this.user = user;
    }
    
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    
    public UserInfo getUser() {
        return user;
    }
    
    public void setUser(UserInfo user) {
        this.user = user;
    }
    
    public static class UserInfo {
        private Long id;
        private String email;
        private Role role;
        private boolean hasSeenCompletionPopup;
        
        public UserInfo() {}
        
        public UserInfo(Long id, String email, Role role, boolean hasSeenCompletionPopup) {
            this.id = id;
            this.email = email;
            this.role = role;
            this.hasSeenCompletionPopup = hasSeenCompletionPopup;
        }
        
        public Long getId() {
            return id;
        }
        
        public void setId(Long id) {
            this.id = id;
        }
        
        public String getEmail() {
            return email;
        }
        
        public void setEmail(String email) {
            this.email = email;
        }
        
        public Role getRole() {
            return role;
        }
        
        public void setRole(Role role) {
            this.role = role;
        }
        
        public boolean isHasSeenCompletionPopup() {
            return hasSeenCompletionPopup;
        }

        public void setHasSeenCompletionPopup(boolean hasSeenCompletionPopup) {
            this.hasSeenCompletionPopup = hasSeenCompletionPopup;
        }
    }
}