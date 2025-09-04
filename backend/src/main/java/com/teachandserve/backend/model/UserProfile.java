package com.teachandserve.backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "user_profiles")
public class UserProfile {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    
    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "interests", columnDefinition = "jsonb")
    private List<String> interests;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "goals", columnDefinition = "jsonb")
    private List<String> goals;
    
    @Column(name = "profile_image_url")
    private String profileImageUrl;
    
    @Column(name = "experience_level")
    @Enumerated(EnumType.STRING)
    private ExperienceLevel experienceLevel;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "skills", columnDefinition = "jsonb")
    private List<String> skills;
    
    @Column(name = "location")
    private String location;
    
    @Column(name = "timezone")
    private String timezone;
    
    @Column(name = "availability")
    private String availability;
    
    // Embedding vector for AI-based matching
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "bio_embedding", columnDefinition = "jsonb")
    private List<Double> bioEmbedding;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "interests_embedding", columnDefinition = "jsonb")
    private List<Double> interestsEmbedding;
    
    @Column(name = "is_profile_complete")
    private Boolean isProfileComplete = false;
    
    @Column(name = "is_available_for_matching")
    private Boolean isAvailableForMatching = true;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Constructors
    public UserProfile() {}
    
    public UserProfile(User user) {
        this.user = user;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public String getBio() {
        return bio;
    }
    
    public void setBio(String bio) {
        this.bio = bio;
    }
    
    public List<String> getInterests() {
        return interests;
    }
    
    public void setInterests(List<String> interests) {
        this.interests = interests;
    }
    
    public List<String> getGoals() {
        return goals;
    }
    
    public void setGoals(List<String> goals) {
        this.goals = goals;
    }
    
    public String getProfileImageUrl() {
        return profileImageUrl;
    }
    
    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }
    
    public ExperienceLevel getExperienceLevel() {
        return experienceLevel;
    }
    
    public void setExperienceLevel(ExperienceLevel experienceLevel) {
        this.experienceLevel = experienceLevel;
    }
    
    public List<String> getSkills() {
        return skills;
    }
    
    public void setSkills(List<String> skills) {
        this.skills = skills;
    }
    
    public String getLocation() {
        return location;
    }
    
    public void setLocation(String location) {
        this.location = location;
    }
    
    public String getTimezone() {
        return timezone;
    }
    
    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }
    
    public String getAvailability() {
        return availability;
    }
    
    public void setAvailability(String availability) {
        this.availability = availability;
    }
    
    public List<Double> getBioEmbedding() {
        return bioEmbedding;
    }
    
    public void setBioEmbedding(List<Double> bioEmbedding) {
        this.bioEmbedding = bioEmbedding;
    }
    
    public List<Double> getInterestsEmbedding() {
        return interestsEmbedding;
    }
    
    public void setInterestsEmbedding(List<Double> interestsEmbedding) {
        this.interestsEmbedding = interestsEmbedding;
    }
    
    public Boolean getIsProfileComplete() {
        return isProfileComplete;
    }
    
    public void setIsProfileComplete(Boolean isProfileComplete) {
        this.isProfileComplete = isProfileComplete;
    }
    
    public Boolean getIsAvailableForMatching() {
        return isAvailableForMatching;
    }
    
    public void setIsAvailableForMatching(Boolean isAvailableForMatching) {
        this.isAvailableForMatching = isAvailableForMatching;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}