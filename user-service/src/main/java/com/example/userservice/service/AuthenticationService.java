package com.example.userservice.service;

import com.example.userservice.dto.AuthenticationRequest;
import com.example.userservice.dto.AuthenticationResponse;
import com.example.userservice.dto.RegisterRequest;
import com.example.userservice.model.Role;
import com.example.userservice.model.User;
import com.example.userservice.repository.UserRepository;
import com.example.userservice.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthenticationResponse register(RegisterRequest request) {
        var user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole() != null ? request.getRole() : Role.STUDENT)
                .affiliation(request.getAffiliation())
                .bio(request.getBio())
                .yearsOfExperience(request.getYearsOfExperience())
                .build();
        repository.save(user);
        
        var claims = new HashMap<String, Object>();
        claims.put("role", user.getRole().name());
        claims.put("userId", user.getId());
        
        var jwtToken = jwtService.generateToken(claims, user);
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .id(user.getId())
                .role(user.getRole().name())
                .build();
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        var user = repository.findByEmail(request.getEmail())
                .orElseThrow();
                
        var claims = new HashMap<String, Object>();
        claims.put("role", user.getRole().name());
        claims.put("userId", user.getId());
        
        var jwtToken = jwtService.generateToken(claims, user);
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .id(user.getId())
                .role(user.getRole().name())
                .build();
    }
}
