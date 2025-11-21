package com.teachandserve.backend.dto;

import com.teachandserve.backend.model.ExperienceLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public class ProfileRequest {
    
    @NotBlank(message = "Bio is required")
    @Size(min = 50, max = 1000, message = "Bio must be between 50-1000 characters")
    private String bio;
    
    private List<String> interests;
    
    private List<String> goals;
    
    private List<String> skills;
    
    private ExperienceLevel experienceLevel;
    
    private String location;
    
    private String timezone;
    
    private String availability;
    
    private String profileImageUrl;

    private String firstName;

    private String lastName;
    
    // Constructors
    public ProfileRequest() {}
    
    public ProfileRequest(String bio, List<String> interests, List<String> goals) {
        this.bio = bio;
        this.interests = interests;
        this.goals = goals;
    }
    
    // Getters and Setters
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

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }
}