package com.teachandserve.backend.dto;

import com.teachandserve.backend.model.ExperienceLevel;
import com.teachandserve.backend.model.Role;

import java.util.List;

public class ProfileResponse {
    
    private Long id;
    private Long userId;
    private String email;
    private Role userRole;
    private String bio;
    private List<String> interests;
    private List<String> goals;
    private List<String> skills;
    private ExperienceLevel experienceLevel;
    private String location;
    private String timezone;
    private String availability;
    private String profileImageUrl;
    private Boolean isProfileComplete;
    private Boolean isAvailableForMatching;
    
    // Constructors
    public ProfileResponse() {}
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public Role getUserRole() {
        return userRole;
    }
    
    public void setUserRole(Role userRole) {
        this.userRole = userRole;
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
    
    public List<String> getSkills() {
        return skills;
    }
    
    public void setSkills(List<String> skills) {
        this.skills = skills;
    }
    
    public ExperienceLevel getExperienceLevel() {
        return experienceLevel;
    }
    
    public void setExperienceLevel(ExperienceLevel experienceLevel) {
        this.experienceLevel = experienceLevel;
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
    
    public String getProfileImageUrl() {
        return profileImageUrl;
    }
    
    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
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
}