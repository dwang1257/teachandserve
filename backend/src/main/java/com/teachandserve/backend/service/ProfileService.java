package com.teachandserve.backend.service;

import com.teachandserve.backend.dto.ProfileRequest;
import com.teachandserve.backend.dto.ProfileResponse;
import com.teachandserve.backend.events.ProfileCompletedEvent;
import com.teachandserve.backend.model.Role;
import com.teachandserve.backend.model.User;
import com.teachandserve.backend.model.UserProfile;
import com.teachandserve.backend.repository.UserProfileRepository;
import com.teachandserve.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProfileService {

    @Autowired
    private UserProfileRepository profileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmbeddingService embeddingService;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Autowired
    private SanitizationService sanitizationService;
    
    public Optional<ProfileResponse> getProfileByUserId(Long userId) {
        Optional<UserProfile> profileOpt = profileRepository.findByUserId(userId);
        if (profileOpt.isEmpty()) {
            return Optional.empty();
        }
        
        return Optional.of(convertToResponse(profileOpt.get()));
    }
    
    public ProfileResponse createOrUpdateProfile(Long userId, ProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        UserProfile profile = profileRepository.findByUserId(userId)
                .orElse(new UserProfile(user));
        
        // Update profile fields
        profile.setBio(request.getBio());
        profile.setInterests(request.getInterests());
        profile.setGoals(request.getGoals());
        profile.setSkills(request.getSkills());
        profile.setExperienceLevel(request.getExperienceLevel());
        profile.setLocation(request.getLocation());
        profile.setTimezone(request.getTimezone());
        profile.setAvailability(request.getAvailability());
        profile.setProfileImageUrl(request.getProfileImageUrl());
        
        // Check if profile is complete
        boolean isComplete = isProfileComplete(profile);
        profile.setIsProfileComplete(isComplete);
        
        // Generate embeddings if bio is provided
        if (request.getBio() != null && !request.getBio().trim().isEmpty()) {
            String embeddingText = embeddingService.createEmbeddingText(
                request.getBio(), 
                request.getInterests()
            );
            List<Double> embedding = embeddingService.generateEmbedding(embeddingText);
            profile.setBioEmbedding(embedding);
        }
        
        profile = profileRepository.save(profile);
        return convertToResponse(profile);
    }
    
    public void deleteProfile(Long userId) {
        profileRepository.findByUserId(userId).ifPresent(profileRepository::delete);
    }
    
    public void toggleAvailabilityForMatching(Long userId, boolean available) {
        profileRepository.findByUserId(userId).ifPresent(profile -> {
            profile.setIsAvailableForMatching(available);
            profileRepository.save(profile);
        });
    }
    
    public ProfileResponse completeProfile(Long userId, ProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        UserProfile profile = profileRepository.findByUserId(userId)
                .orElse(new UserProfile(user));

        // Update required fields for completion (with XSS sanitization)
        profile.setBio(sanitizationService.sanitize(request.getBio()));
        if (request.getInterests() != null) {
            profile.setInterests(request.getInterests().stream()
                    .map(sanitizationService::sanitizePlainText)
                    .collect(Collectors.toList()));
        }
        if (request.getGoals() != null) {
            profile.setGoals(request.getGoals().stream()
                    .map(sanitizationService::sanitize)
                    .collect(Collectors.toList()));
        }

        // Update optional fields if provided (with XSS sanitization)
        if (request.getSkills() != null) {
            profile.setSkills(request.getSkills().stream()
                    .map(sanitizationService::sanitizePlainText)
                    .collect(Collectors.toList()));
        }
        if (request.getExperienceLevel() != null) {
            profile.setExperienceLevel(request.getExperienceLevel());
        }
        if (request.getLocation() != null) {
            profile.setLocation(sanitizationService.sanitizePlainText(request.getLocation()));
        }
        if (request.getTimezone() != null) {
            profile.setTimezone(sanitizationService.sanitizePlainText(request.getTimezone()));
        }
        if (request.getAvailability() != null) {
            profile.setAvailability(sanitizationService.sanitizePlainText(request.getAvailability()));
        }
        if (request.getProfileImageUrl() != null) {
            // URL validation should be added here for additional security
            profile.setProfileImageUrl(sanitizationService.sanitizePlainText(request.getProfileImageUrl()));
        }
        
        // Mark profile as complete
        profile.setIsProfileComplete(true);
        
        // Generate embeddings for matching
        String embeddingText = embeddingService.createEmbeddingText(
            request.getBio(), 
            request.getInterests()
        );
        
        // Add goals to embedding text for better matching
        if (request.getGoals() != null && !request.getGoals().isEmpty()) {
            embeddingText += " Goals: " + String.join(", ", request.getGoals());
        }
        
        List<Double> embedding = embeddingService.generateEmbedding(embeddingText);
        profile.setBioEmbedding(embedding);
        
        profile = profileRepository.save(profile);
        
        // Publish profile completion event for automatic matching
        try {
            eventPublisher.publishEvent(new ProfileCompletedEvent(this, userId));
        } catch (Exception e) {
            // Silent failure - consider adding proper logging
        }
        
        return convertToResponse(profile);
    }
    
    private boolean isProfileComplete(UserProfile profile) {
        return profile.getBio() != null && !profile.getBio().trim().isEmpty() &&
               profile.getInterests() != null && !profile.getInterests().isEmpty() &&
               profile.getGoals() != null && !profile.getGoals().isEmpty() &&
               profile.getExperienceLevel() != null;
    }
    
    private ProfileResponse convertToResponse(UserProfile profile) {
        ProfileResponse response = new ProfileResponse();
        response.setId(profile.getId());
        response.setUserId(profile.getUser().getId());
        response.setEmail(profile.getUser().getEmail());
        response.setUserRole(profile.getUser().getRole());
        response.setBio(profile.getBio());
        response.setInterests(profile.getInterests());
        response.setGoals(profile.getGoals());
        response.setSkills(profile.getSkills());
        response.setExperienceLevel(profile.getExperienceLevel());
        response.setLocation(profile.getLocation());
        response.setTimezone(profile.getTimezone());
        response.setAvailability(profile.getAvailability());
        response.setProfileImageUrl(profile.getProfileImageUrl());
        response.setIsProfileComplete(profile.getIsProfileComplete());
        response.setIsAvailableForMatching(profile.getIsAvailableForMatching());
        return response;
    }
}