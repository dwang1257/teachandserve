package com.teachandserve.backend.controller;

import com.teachandserve.backend.dto.ProfileRequest;
import com.teachandserve.backend.dto.ProfileResponse;
import com.teachandserve.backend.model.Role;
import com.teachandserve.backend.model.User;
import com.teachandserve.backend.service.MatchingService;
import com.teachandserve.backend.service.ProfileService;
import com.teachandserve.backend.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "http://localhost:3000")
public class ProfileController {
    
    @Autowired
    private ProfileService profileService;
    
    @Autowired
    private MatchingService matchingService;
    
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUserProfile() {
        User user = getCurrentUser();
        Optional<ProfileResponse> profile = profileService.getProfileByUserId(user.getId());
        
        if (profile.isPresent()) {
            return ResponseEntity.ok(profile.get());
        } else {
            return ResponseEntity.ok(Map.of(
                "message", "Profile not found",
                "hasProfile", false,
                "userId", user.getId(),
                "userRole", user.getRole()
            ));
        }
    }
    
    @PostMapping("/me")
    public ResponseEntity<?> createOrUpdateProfile(@Valid @RequestBody ProfileRequest request) {
        User user = getCurrentUser();
        
        try {
            ProfileResponse profile = profileService.createOrUpdateProfile(user.getId(), request);
            return ResponseEntity.ok(Map.of(
                "message", "Profile saved successfully",
                "profile", profile
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Failed to save profile",
                "error", e.getMessage()
            ));
        }
    }
    
    @PostMapping("/complete")
    public ResponseEntity<?> completeProfile(@Valid @RequestBody ProfileRequest request) {
        User user = getCurrentUser();
        
        try {
            // Validate required fields for completion
            if (request.getBio() == null || request.getBio().length() < 50) {
                return ResponseEntity.badRequest().body(Map.of(
                    "message", "Bio must be at least 50 characters long"
                ));
            }
            
            if (request.getInterests() == null || request.getInterests().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "message", "At least one interest is required"
                ));
            }
            
            if (request.getGoals() == null || request.getGoals().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "message", "At least one goal is required"
                ));
            }
            
            ProfileResponse profile = profileService.completeProfile(user.getId(), request);
            
            return ResponseEntity.ok(Map.of(
                "message", "Profile completed successfully! Matching initiated.",
                "profile", profile
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Failed to complete profile",
                "error", e.getMessage()
            ));
        }
    }
    
    @DeleteMapping("/me")
    public ResponseEntity<?> deleteCurrentUserProfile() {
        User user = getCurrentUser();
        profileService.deleteProfile(user.getId());
        
        return ResponseEntity.ok(Map.of("message", "Profile deleted successfully"));
    }
    
    @PutMapping("/me/availability")
    public ResponseEntity<?> toggleAvailability(@RequestBody Map<String, Boolean> request) {
        User user = getCurrentUser();
        boolean available = request.getOrDefault("available", true);
        
        profileService.toggleAvailabilityForMatching(user.getId(), available);
        
        return ResponseEntity.ok(Map.of(
            "message", "Availability updated",
            "available", available
        ));
    }
    
    @GetMapping("/matches")
    public ResponseEntity<?> getMatches(
            @RequestParam(defaultValue = "10") int limit
    ) {
        User user = getCurrentUser();
        
        try {
            List<ProfileResponse> matches;
            
            if (user.getRole() == Role.MENTEE) {
                matches = matchingService.findMatchingMentors(user.getId(), limit);
            } else {
                matches = matchingService.findMatchingMentees(user.getId(), limit);
            }
            
            return ResponseEntity.ok(Map.of(
                "matches", matches,
                "count", matches.size(),
                "userRole", user.getRole()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Failed to find matches",
                "error", e.getMessage()
            ));
        }
    }
    
    @GetMapping("/search")
    public ResponseEntity<?> searchProfiles(
            @RequestParam("interests") List<String> interests,
            @RequestParam(defaultValue = "10") int limit
    ) {
        User user = getCurrentUser();
        
        // Search opposite role (mentees search for mentors, mentors search for mentees)
        Role searchRole = user.getRole() == Role.MENTEE ? Role.MENTOR : Role.MENTEE;
        
        List<ProfileResponse> results = matchingService.findProfilesByInterests(
            interests, searchRole, limit
        );
        
        return ResponseEntity.ok(Map.of(
            "results", results,
            "count", results.size(),
            "searchedInterests", interests,
            "searchRole", searchRole
        ));
    }
    
    @GetMapping("/{userId}")
    public ResponseEntity<?> getProfileByUserId(@PathVariable Long userId) {
        Optional<ProfileResponse> profile = profileService.getProfileByUserId(userId);
        
        if (profile.isPresent()) {
            return ResponseEntity.ok(profile.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @Autowired
    private UserRepository userRepository;
    
    @PostMapping("/popup-seen")
    public ResponseEntity<?> markPopupAsSeen() {
        User user = getCurrentUser();
        user.setHasSeenCompletionPopup(true);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Popup marked as seen"));
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated() || 
            authentication.getPrincipal() instanceof String) {
            throw new RuntimeException("User not authenticated");
        }
        
        return (User) authentication.getPrincipal();
    }
}