package com.teachandserve.backend.controller;

import com.teachandserve.backend.model.Mentee;
import com.teachandserve.backend.repository.MenteeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/mentees")
public class MenteeController {

    private final MenteeRepository menteeRepository;

    public MenteeController(MenteeRepository menteeRepository) {
        this.menteeRepository = menteeRepository;
    }

    @PostMapping
    public Mentee createMentee(@RequestBody Mentee mentee) {
        return menteeRepository.save(mentee);
    }
}