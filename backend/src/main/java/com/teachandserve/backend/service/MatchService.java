package com.teachandserve.backend.service;

import com.teachandserve.backend.model.Match;
import com.teachandserve.backend.model.MatchStatus;
import com.teachandserve.backend.repository.MatchRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class MatchService {

    private final MatchRepository matchRepository;

    public MatchService(MatchRepository matchRepository) {
        this.matchRepository = matchRepository;
    }

    /**
     * Check if two users are matched (have an ACCEPTED match).
     * This method checks both directions: user1 could be mentor or mentee.
     *
     * TODO: In production, consider caching this check for performance.
     * TODO: Add logic to check for specific match types or statuses as needed.
     *
     * @param userId1 First user ID
     * @param userId2 Second user ID
     * @return true if users have an accepted match, false otherwise
     */
    public boolean areMatched(Long userId1, Long userId2) {
        if (userId1 == null || userId2 == null || userId1.equals(userId2)) {
            return false;
        }

        // Check if userId1 is mentee and userId2 is mentor
        Optional<Match> match1 = matchRepository.findByMenteeIdAndMentorId(userId1, userId2);
        if (match1.isPresent() && match1.get().getStatus() == MatchStatus.ACCEPTED) {
            return true;
        }

        // Check if userId2 is mentee and userId1 is mentor
        Optional<Match> match2 = matchRepository.findByMenteeIdAndMentorId(userId2, userId1);
        return match2.isPresent() && match2.get().getStatus() == MatchStatus.ACCEPTED;
    }

    /**
     * Get the match between two users if it exists.
     *
     * @param userId1 First user ID
     * @param userId2 Second user ID
     * @return Optional containing the match if found
     */
    public Optional<Match> getMatchBetweenUsers(Long userId1, Long userId2) {
        Optional<Match> match1 = matchRepository.findByMenteeIdAndMentorId(userId1, userId2);
        if (match1.isPresent()) {
            return match1;
        }
        return matchRepository.findByMenteeIdAndMentorId(userId2, userId1);
    }
}
