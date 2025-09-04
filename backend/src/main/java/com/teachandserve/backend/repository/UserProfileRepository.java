package com.teachandserve.backend.repository;

import com.teachandserve.backend.model.UserProfile;
import com.teachandserve.backend.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    
    @Query("SELECT p FROM UserProfile p WHERE p.user.id = :userId")
    Optional<UserProfile> findByUserId(@Param("userId") Long userId);
    
    @Query("SELECT COUNT(p) > 0 FROM UserProfile p WHERE p.user.id = :userId")
    boolean existsByUserId(@Param("userId") Long userId);
    
    @Query("SELECT p FROM UserProfile p WHERE p.user.role = :role AND p.isAvailableForMatching = true AND p.isProfileComplete = true")
    List<UserProfile> findAvailableProfilesByRole(@Param("role") Role role);
    
    @Query("SELECT p FROM UserProfile p WHERE p.user.role = :role AND p.isProfileComplete = true")
    List<UserProfile> findCompleteProfilesByRole(@Param("role") Role role);
    
    @Query("SELECT p FROM UserProfile p WHERE p.bioEmbedding IS NOT NULL AND p.user.role = :role AND p.isAvailableForMatching = true")
    List<UserProfile> findProfilesWithEmbeddingsByRole(@Param("role") Role role);
}