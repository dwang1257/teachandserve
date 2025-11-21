package com.teachandserve.backend.service;

import com.teachandserve.backend.dto.MatchResponse;
import com.teachandserve.backend.dto.ProfileResponse;
import com.teachandserve.backend.model.Match;
import com.teachandserve.backend.model.Role;
import com.teachandserve.backend.model.User;
import com.teachandserve.backend.model.UserProfile;
import com.teachandserve.backend.repository.MatchRepository;
import com.teachandserve.backend.repository.UserProfileRepository;
import com.teachandserve.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MatchingService {

    private static final Logger log = LoggerFactory.getLogger(MatchingService.class);

    @Autowired
    private UserProfileRepository profileRepository;

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private EmbeddingService embeddingService;
    
    @Autowired
    private ProfileService profileService;
    
    /**
     * Find matching mentors for a mentee based on embedding similarity
     */
    public List<ProfileResponse> findMatchingMentors(Long menteeUserId, int limit) {
        // Get mentee's profile
        UserProfile menteeProfile = profileRepository.findByUserId(menteeUserId)
                .orElseThrow(() -> new RuntimeException("Mentee profile not found"));
        
        if (menteeProfile.getBioEmbedding() == null) {
            // Fallback to basic matching if no embedding available
            return findBasicMatches(Role.MENTOR, limit);
        }
        
        // Get all available mentor profiles with embeddings
        List<UserProfile> mentorProfiles = profileRepository.findProfilesWithEmbeddingsByRole(Role.MENTOR);
        
        // Calculate similarity scores and sort
        List<ProfileMatch> matches = mentorProfiles.stream()
                .filter(mentor -> !mentor.getUser().getId().equals(menteeUserId)) // Exclude self
                .map(mentor -> {
                    double similarity = embeddingService.calculateCosineSimilarity(
                            menteeProfile.getBioEmbedding(),
                            mentor.getBioEmbedding()
                    );
                    return new ProfileMatch(mentor, similarity);
                })
                .sorted(Comparator.comparing(ProfileMatch::getSimilarity).reversed())
                .limit(limit)
                .collect(Collectors.toList());
        
        return matches.stream()
                .map(match -> profileService.getProfileByUserId(match.getProfile().getUser().getId()))
                .filter(opt -> opt.isPresent())
                .map(opt -> opt.get())
                .collect(Collectors.toList());
    }
    
    /**
     * Find matching mentees for a mentor based on embedding similarity
     */
    public List<ProfileResponse> findMatchingMentees(Long mentorUserId, int limit) {
        // Get mentor's profile
        UserProfile mentorProfile = profileRepository.findByUserId(mentorUserId)
                .orElseThrow(() -> new RuntimeException("Mentor profile not found"));
        
        if (mentorProfile.getBioEmbedding() == null) {
            // Fallback to basic matching if no embedding available
            return findBasicMatches(Role.MENTEE, limit);
        }
        
        // Get all available mentee profiles with embeddings
        List<UserProfile> menteeProfiles = profileRepository.findProfilesWithEmbeddingsByRole(Role.MENTEE);
        
        // Calculate similarity scores and sort
        List<ProfileMatch> matches = menteeProfiles.stream()
                .filter(mentee -> !mentee.getUser().getId().equals(mentorUserId)) // Exclude self
                .map(mentee -> {
                    double similarity = embeddingService.calculateCosineSimilarity(
                            mentorProfile.getBioEmbedding(),
                            mentee.getBioEmbedding()
                    );
                    return new ProfileMatch(mentee, similarity);
                })
                .sorted(Comparator.comparing(ProfileMatch::getSimilarity).reversed())
                .limit(limit)
                .collect(Collectors.toList());
        
        return matches.stream()
                .map(match -> profileService.getProfileByUserId(match.getProfile().getUser().getId()))
                .filter(opt -> opt.isPresent())
                .map(opt -> opt.get())
                .collect(Collectors.toList());
    }
    
    /**
     * Basic matching fallback when embeddings are not available
     */
    private List<ProfileResponse> findBasicMatches(Role role, int limit) {
        List<UserProfile> profiles = profileRepository.findAvailableProfilesByRole(role);
        
        return profiles.stream()
                .limit(limit)
                .map(profile -> profileService.getProfileByUserId(profile.getUser().getId()))
                .filter(opt -> opt.isPresent())
                .map(opt -> opt.get())
                .collect(Collectors.toList());
    }
    
    /**
     * Find profiles by interest keywords
     */
    public List<ProfileResponse> findProfilesByInterests(List<String> interests, Role role, int limit) {
        List<UserProfile> allProfiles = profileRepository.findAvailableProfilesByRole(role);
        
        List<ProfileMatch> matches = new ArrayList<>();
        
        for (UserProfile profile : allProfiles) {
            if (profile.getInterests() != null) {
                long matchingInterests = profile.getInterests().stream()
                        .mapToLong(interest -> 
                            interests.stream()
                                .anyMatch(searchInterest -> 
                                    interest.toLowerCase().contains(searchInterest.toLowerCase())
                                ) ? 1 : 0
                        )
                        .sum();
                
                if (matchingInterests > 0) {
                    double score = (double) matchingInterests / interests.size();
                    matches.add(new ProfileMatch(profile, score));
                }
            }
        }
        
        return matches.stream()
                .sorted(Comparator.comparing(ProfileMatch::getSimilarity).reversed())
                .limit(limit)
                .map(match -> profileService.getProfileByUserId(match.getProfile().getUser().getId()))
                .filter(opt -> opt.isPresent())
                .map(opt -> opt.get())
                .collect(Collectors.toList());
    }
    
    /**
     * Get matches for a user by email
     */
    public List<MatchResponse> getMatchesForUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<Match> matches = matchRepository.findByUserId(user.getId());
        return matches.stream()
                .map(this::convertToMatchResponse)
                .collect(Collectors.toList());
    }
    
    private MatchResponse convertToMatchResponse(Match match) {
        MatchResponse response = new MatchResponse();
        response.setId(match.getId());
        response.setMatchScore(match.getSimilarityScore());
        response.setStatus(match.getStatus());
        response.setMatchedAt(match.getMatchedAt());
        response.setCreatedAt(match.getCreatedAt());
        
        // Get mentee profile
        ProfileResponse menteeProfile = profileService.getProfileByUserId(match.getMentee().getId()).orElse(null);
        response.setMenteeProfile(menteeProfile);
        
        // Get mentor profile
        ProfileResponse mentorProfile = profileService.getProfileByUserId(match.getMentor().getId()).orElse(null);
        response.setMentorProfile(mentorProfile);
        
        return response;
    }
    
    /**
     * Accept a match and update its status to ACCEPTED
     */
    public MatchResponse acceptMatch(Long matchId, String userEmail) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Match not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Verify user is part of this match
        if (!match.getMentee().getId().equals(user.getId()) &&
            !match.getMentor().getId().equals(user.getId())) {
            throw new IllegalArgumentException("User is not part of this match");
        }

        // Update status to ACCEPTED
        match.setStatus(com.teachandserve.backend.model.MatchStatus.ACCEPTED);
        match.setAcceptedAt(java.time.LocalDateTime.now());
        match = matchRepository.save(match);

        log.info("Match {} accepted by user {}", matchId, userEmail);

        return convertToMatchResponse(match);
    }

    /**
     * Reject a match and update its status to REJECTED
     */
    public MatchResponse rejectMatch(Long matchId, String userEmail) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new IllegalArgumentException("Match not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Verify user is part of this match
        if (!match.getMentee().getId().equals(user.getId()) &&
            !match.getMentor().getId().equals(user.getId())) {
            throw new IllegalArgumentException("User is not part of this match");
        }

        // Update status to REJECTED
        match.setStatus(com.teachandserve.backend.model.MatchStatus.REJECTED);
        match.setRejectedAt(java.time.LocalDateTime.now());
        match = matchRepository.save(match);

        log.info("Match {} rejected by user {}", matchId, userEmail);

        return convertToMatchResponse(match);
    }

    /**
     * Helper class to store profile with similarity score
     */
    private static class ProfileMatch {
        private final UserProfile profile;
        private final double similarity;

        public ProfileMatch(UserProfile profile, double similarity) {
            this.profile = profile;
            this.similarity = similarity;
        }

        public UserProfile getProfile() {
            return profile;
        }

        public double getSimilarity() {
            return similarity;
        }
    }
}