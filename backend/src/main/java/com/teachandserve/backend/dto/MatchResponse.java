package com.teachandserve.backend.dto;

import com.teachandserve.backend.model.MatchStatus;

import java.time.LocalDateTime;

public class MatchResponse {
    private Long id;
    private ProfileResponse menteeProfile;
    private ProfileResponse mentorProfile;
    private Double matchScore;
    private MatchStatus status;
    private LocalDateTime matchedAt;
    private LocalDateTime createdAt;
    
    // Constructors
    public MatchResponse() {}
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public ProfileResponse getMenteeProfile() {
        return menteeProfile;
    }
    
    public void setMenteeProfile(ProfileResponse menteeProfile) {
        this.menteeProfile = menteeProfile;
    }
    
    public ProfileResponse getMentorProfile() {
        return mentorProfile;
    }
    
    public void setMentorProfile(ProfileResponse mentorProfile) {
        this.mentorProfile = mentorProfile;
    }
    
    public Double getMatchScore() {
        return matchScore;
    }
    
    public void setMatchScore(Double matchScore) {
        this.matchScore = matchScore;
    }
    
    public MatchStatus getStatus() {
        return status;
    }
    
    public void setStatus(MatchStatus status) {
        this.status = status;
    }
    
    public LocalDateTime getMatchedAt() {
        return matchedAt;
    }
    
    public void setMatchedAt(LocalDateTime matchedAt) {
        this.matchedAt = matchedAt;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}