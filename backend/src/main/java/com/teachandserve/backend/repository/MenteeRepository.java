package com.teachandserve.backend.repository;

import com.teachandserve.backend.model.Mentee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MenteeRepository extends JpaRepository<Mentee, Long> {
    
}