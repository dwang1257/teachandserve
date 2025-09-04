package com.teachandserve.backend.model;

public enum MatchStatus {
    PENDING,     // Match created but not yet responded to
    ACCEPTED,    // Both parties have accepted the match
    REJECTED,    // One or both parties rejected the match
    COMPLETED,   // Mentorship has been completed
    INACTIVE     // Match is no longer active
}