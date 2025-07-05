package com.teachandserve.backend.controller;

import com.teachandserve.backend.model.Mentee;
import com.teachandserve.backend.repository.MenteeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/mentees")
@CrossOrigin(origins = "http://localhost:3000")
public class MenteeController {

    @Autowired
    private MenteeRepository menteeRepository;

    @PostMapping
    public Mentee createMentee(@RequestBody Mentee mentee) {
        return menteeRepository.save(mentee);
    }
}