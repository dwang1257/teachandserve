package com.teachandserve.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors()  // Enable CORS with your CorsFilter
            .and()
            .csrf().disable()  // Disable CSRF for development/testing
            .authorizeHttpRequests()
            .anyRequest().permitAll();  // Allow all endpoints for now

        return http.build();
    }
}