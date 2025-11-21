package com.teachandserve.backend.controller;

import com.teachandserve.backend.dto.AuthResponse;
import com.teachandserve.backend.dto.LoginRequest;
import com.teachandserve.backend.dto.SignupRequest;
import com.teachandserve.backend.model.User;
import com.teachandserve.backend.repository.UserRepository;
import com.teachandserve.backend.security.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signupRequest, BindingResult bindingResult) {
        // Check for validation errors
        if (bindingResult.hasErrors()) {
            Map<String, String> errors = new HashMap<>();
            for (FieldError error : bindingResult.getFieldErrors()) {
                errors.put(error.getField(), error.getDefaultMessage());
            }
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Validation failed",
                "errors", errors
            ));
        }
        
        if (userRepository.existsByEmail(signupRequest.getEmail())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Email is already taken"));
        }
        
        try {
            User user = new User(signupRequest.getEmail(),
                               passwordEncoder.encode(signupRequest.getPassword()),
                               signupRequest.getRole());
            
            userRepository.save(user);
            
            String jwt = jwtUtil.generateToken(user);
            
            AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
                    user.getId(),
                    user.getEmail(),
                    user.getRole(),
                    user.isHasSeenCompletionPopup(),
                    user.getFirstName(),
                    user.getLastName());
            
            return ResponseEntity.ok(new AuthResponse(jwt, userInfo));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Signup failed: " + e.getMessage()
            ));
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest, BindingResult bindingResult) {
        // Check for validation errors
        if (bindingResult.hasErrors()) {
            Map<String, String> errors = new HashMap<>();
            for (FieldError error : bindingResult.getFieldErrors()) {
                errors.put(error.getField(), error.getDefaultMessage());
            }
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Validation failed",
                "errors", errors
            ));
        }
        
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));
            
            User user = (User) authentication.getPrincipal();
            String jwt = jwtUtil.generateToken(user);
            
            AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
                    user.getId(),
                    user.getEmail(),
                    user.getRole(),
                    user.isHasSeenCompletionPopup(),
                    user.getFirstName(),
                    user.getLastName());
            
            return ResponseEntity.ok(new AuthResponse(jwt, userInfo));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Invalid email or password"
            ));
        }
    }
    
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated() || 
            authentication.getPrincipal() instanceof String) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        
        User user = (User) authentication.getPrincipal();
        
        AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
                user.getId(),
                user.getEmail(),
                user.getRole(),
                user.isHasSeenCompletionPopup(),
                user.getFirstName(),
                user.getLastName());
        
        return ResponseEntity.ok(userInfo);
    }
    
    public static class MessageResponse {
        private String message;
        
        public MessageResponse(String message) {
            this.message = message;
        }
        
        public String getMessage() {
            return message;
        }
        
        public void setMessage(String message) {
            this.message = message;
        }
    }
}