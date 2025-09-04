package com.teachandserve.backend.controller;

import com.teachandserve.backend.dto.MatchResponse;
import com.teachandserve.backend.service.MatchingService;
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
            System.out.println("Getting matches for user: " + email);
            
            List<MatchResponse> matches = matchingService.getMatchesForUser(email);
            System.out.println("Found " + matches.size() + " matches");
            
            return ResponseEntity.ok(matches);
        } catch (Exception e) {
            System.err.println("Error getting matches: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    @GetMapping("/debug")
    public ResponseEntity<String> debug() {
        return ResponseEntity.ok("Match controller is working");
    }
}