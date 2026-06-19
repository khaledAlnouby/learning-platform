package com.example.userservice.controller;

import com.example.userservice.dto.ValidationResponse;
import com.example.userservice.model.User;
import com.example.userservice.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/validate")
@RequiredArgsConstructor
public class TokenValidationController {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @GetMapping
    public ResponseEntity<ValidationResponse> validateToken(@RequestParam String token) {
        try {
            String username = jwtService.extractUsername(token);
            User user = (User) userDetailsService.loadUserByUsername(username);
            boolean isValid = jwtService.isTokenValid(token, user);
            
            if (isValid) {
                return ResponseEntity.ok(ValidationResponse.builder()
                        .valid(true)
                        .userId(user.getId())
                        .role(user.getRole().name())
                        .build());
            }
        } catch (Exception e) {
            // Invalid token
        }
        return ResponseEntity.ok(ValidationResponse.builder().valid(false).build());
    }
}
