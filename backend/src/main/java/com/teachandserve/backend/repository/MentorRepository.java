package com.teachandserve.backend.repository;

import com.teachandserve.backend.model.Mentor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MentorRepository extends JpaRepository<Mentor, Long> {
}