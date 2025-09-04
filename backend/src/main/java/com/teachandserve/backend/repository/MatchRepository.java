package com.teachandserve.backend.repository;

import com.teachandserve.backend.model.Match;
import com.teachandserve.backend.model.MatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {
    
    @Query("SELECT m FROM Match m WHERE m.mentee.id = :menteeId")
    List<Match> findByMenteeId(@Param("menteeId") Long menteeId);
    
    @Query("SELECT m FROM Match m WHERE m.mentor.id = :mentorId")
    List<Match> findByMentorId(@Param("mentorId") Long mentorId);
    
    @Query("SELECT m FROM Match m WHERE (m.mentee.id = :userId OR m.mentor.id = :userId)")
    List<Match> findByUserId(@Param("userId") Long userId);
    
    @Query("SELECT m FROM Match m WHERE m.mentee.id = :menteeId AND m.mentor.id = :mentorId")
    Optional<Match> findByMenteeIdAndMentorId(@Param("menteeId") Long menteeId, @Param("mentorId") Long mentorId);
    
    @Query("SELECT m FROM Match m WHERE m.status = :status")
    List<Match> findByStatus(@Param("status") MatchStatus status);
    
    @Query("SELECT m FROM Match m WHERE (m.mentee.id = :userId OR m.mentor.id = :userId) AND m.status = :status")
    List<Match> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") MatchStatus status);
    
    @Query("SELECT COUNT(m) > 0 FROM Match m WHERE m.mentee.id = :menteeId AND m.mentor.id = :mentorId")
    boolean existsByMenteeIdAndMentorId(@Param("menteeId") Long menteeId, @Param("mentorId") Long mentorId);
}