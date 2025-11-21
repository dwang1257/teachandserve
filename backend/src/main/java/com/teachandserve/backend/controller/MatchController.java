package com.teachandserve.backend.controller;

import com.teachandserve.backend.dto.MatchResponse;
import com.teachandserve.backend.service.MatchingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
@CrossOrigin(origins = "*")
public class MatchController {

    private static final Logger log = LoggerFactory.getLogger(MatchController.class);

    @Autowired
    private MatchingService matchingService;
    
    @GetMapping("/my-matches")
    public ResponseEntity<List<MatchResponse>> getMyMatches() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal() instanceof String) {
                return ResponseEntity.status(401).build();
            }
            
            String email = authentication.getName();
            log.info("Getting matches for user: {}", email);

            List<MatchResponse> matches = matchingService.getMatchesForUser(email);
            log.debug("Found {} matches for user: {}", matches.size(), email);
            
            return ResponseEntity.ok(matches);
        } catch (Exception e) {
            log.error("Error getting matches for user", e);
            throw e;
        }
    }
    
    @GetMapping("/debug")
    public ResponseEntity<String> debug() {
        return ResponseEntity.ok("Match controller is working");
    }

    @PostMapping("/{matchId}/accept")
    public ResponseEntity<?> acceptMatch(@PathVariable Long matchId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal() instanceof String) {
                return ResponseEntity.status(401).build();
            }

            String email = authentication.getName();
            log.info("User {} accepting match {}", email, matchId);

            MatchResponse updatedMatch = matchingService.acceptMatch(matchId, email);
            return ResponseEntity.ok(updatedMatch);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error accepting match {}", matchId, e);
            return ResponseEntity.status(500).body("Failed to accept match");
        }
    }

    @PostMapping("/{matchId}/reject")
    public ResponseEntity<?> rejectMatch(@PathVariable Long matchId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal() instanceof String) {
                return ResponseEntity.status(401).build();
            }

            String email = authentication.getName();
            log.info("User {} rejecting match {}", email, matchId);

            MatchResponse updatedMatch = matchingService.rejectMatch(matchId, email);
            return ResponseEntity.ok(updatedMatch);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error rejecting match {}", matchId, e);
            return ResponseEntity.status(500).body("Failed to reject match");
        }
    }
}