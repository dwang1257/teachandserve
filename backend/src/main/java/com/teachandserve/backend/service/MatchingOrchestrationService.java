package com.teachandserve.backend.service;

import com.teachandserve.backend.dto.ProfileResponse;
import com.teachandserve.backend.events.ProfileCompletedEvent;
import com.teachandserve.backend.model.Match;
import com.teachandserve.backend.model.Role;
import com.teachandserve.backend.model.User;
import com.teachandserve.backend.repository.MatchRepository;
import com.teachandserve.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class MatchingOrchestrationService {

    private static final Logger log = LoggerFactory.getLogger(MatchingOrchestrationService.class);

    @Autowired
    private MatchingService matchingService;

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private UserRepository userRepository;
    
    /**
     * Event listener for profile completion - triggers automatic matching
     */
    @EventListener
    public void handleProfileCompletion(ProfileCompletedEvent event) {
        try {
            Long userId = event.getUserId();
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            if (user.getRole() == Role.MENTEE) {
                triggerMenteeMatching(userId);
            } else if (user.getRole() == Role.MENTOR) {
                triggerMentorMatching(userId);
            }
        } catch (Exception e) {
            log.error("Failed to process profile completion event for user {}", event.getUserId(), e);
        }
    }
    
    private void triggerMenteeMatching(Long menteeUserId) {
        log.info("Triggering mentee matching for user ID: {}", menteeUserId);

        // Find potential mentors for this mentee
        List<ProfileResponse> potentialMentors = matchingService.findMatchingMentors(menteeUserId, 5);
        log.info("Found {} potential mentors for mentee {}", potentialMentors.size(), menteeUserId);

        User menteeUser = userRepository.findById(menteeUserId).orElse(null);
        if (menteeUser == null) {
            log.warn("Mentee user not found: {}", menteeUserId);
            return;
        }

        for (ProfileResponse mentorProfile : potentialMentors) {
            log.debug("Processing mentor: {}", mentorProfile.getEmail());

            // Check if match already exists
            if (!matchRepository.existsByMenteeIdAndMentorId(menteeUserId, mentorProfile.getUserId())) {
                User mentorUser = userRepository.findById(mentorProfile.getUserId()).orElse(null);
                if (mentorUser != null) {
                    // Calculate similarity score (you might want to get this from the matching algorithm)
                    double similarityScore = calculateSimilarityScore(menteeUserId, mentorProfile.getUserId());

                    Match match = new Match(menteeUser, mentorUser, similarityScore);
                    matchRepository.save(match);
                    log.info("Created match between {} and {} with score: {}",
                            menteeUser.getEmail(), mentorUser.getEmail(), similarityScore);
                } else {
                    log.warn("Mentor user not found for ID: {}", mentorProfile.getUserId());
                }
            } else {
                log.debug("Match already exists between mentee {} and mentor {}",
                         menteeUserId, mentorProfile.getUserId());
            }
        }
    }
    
    private void triggerMentorMatching(Long mentorUserId) {
        // Find potential mentees for this mentor
        List<ProfileResponse> potentialMentees = matchingService.findMatchingMentees(mentorUserId, 5);
        
        User mentorUser = userRepository.findById(mentorUserId).orElse(null);
        if (mentorUser == null) return;
        
        for (ProfileResponse menteeProfile : potentialMentees) {
            // Check if match already exists
            if (!matchRepository.existsByMenteeIdAndMentorId(menteeProfile.getUserId(), mentorUserId)) {
                User menteeUser = userRepository.findById(menteeProfile.getUserId()).orElse(null);
                if (menteeUser != null) {
                    // Calculate similarity score
                    double similarityScore = calculateSimilarityScore(menteeProfile.getUserId(), mentorUserId);
                    
                    Match match = new Match(menteeUser, mentorUser, similarityScore);
                    matchRepository.save(match);
                }
            }
        }
    }
    
    private double calculateSimilarityScore(Long menteeUserId, Long mentorUserId) {
        // This is a simplified version - in practice, you'd use the actual embedding similarity
        // For now, we'll return a reasonable default
        try {
            List<ProfileResponse> mentorMatches = matchingService.findMatchingMentors(menteeUserId, 10);
            
            for (int i = 0; i < mentorMatches.size(); i++) {
                ProfileResponse mentor = mentorMatches.get(i);
                if (mentor.getUserId().equals(mentorUserId)) {
                    // Return a score based on ranking (higher ranking = higher score)
                    return 1.0 - (double) i / mentorMatches.size();
                }
            }
            
            return 0.5; // Default score if not found in top matches
        } catch (Exception e) {
            return 0.5; // Default score on error
        }
    }
}