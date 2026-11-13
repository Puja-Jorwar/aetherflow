package com.aetherflow.controller;

import com.aetherflow.dto.*;
import com.aetherflow.model.Business;
import com.aetherflow.model.User;
import com.aetherflow.repository.BusinessRepository;
import com.aetherflow.repository.UserRepository;
import com.aetherflow.security.JwtTokenUtil;
import com.aetherflow.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BusinessRepository businessRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    private UserPayload convertToPayload(User user) {
        return UserPayload.builder()
                .mongoId(user.getId().toString())
                .id(user.getId())
                .businessId(user.getBusinessId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    @PostMapping("/register")
    @Transactional
    public ResponseEntity<ApiResponse> register(@RequestBody RegisterRequest request) {
        String name = request.getName();
        String email = request.getEmail();
        String password = request.getPassword();

        if (name == null || name.trim().isEmpty() ||
            email == null || email.trim().isEmpty() ||
            password == null || password.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please provide name, email, and password");
        }

        String cleanedEmail = email.toLowerCase().trim();

        // 1. Check if user already exists
        if (userRepository.findByEmail(cleanedEmail).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already in use. Please use a different one.");
        }

        // 2. Create default business tenant profile
        String cleanEmailStr = cleanedEmail.replaceAll("[^a-z0-9]", "");
        String uniqueSuffix = UUID.randomUUID().toString().replaceAll("-", "").substring(0, 5);
        String defaultSubdomain = (cleanEmailStr.length() > 15 ? cleanEmailStr.substring(0, 15) : cleanEmailStr) + "-" + uniqueSuffix;
        String defaultBusinessName = name + "'s Institute";

        Business business = new Business();
        business.setName(defaultBusinessName);
        business.setSubdomain(defaultSubdomain);
        business = businessRepository.save(business);

        // 3. Hash password
        String passwordHash = passwordEncoder.encode(password);

        // 4. Create user linked to business as Owner
        User user = new User();
        user.setBusinessId(business.getId());
        user.setName(name);
        user.setEmail(cleanedEmail);
        user.setPasswordHash(passwordHash);
        user.setRole("Owner");
        user = userRepository.save(user);

        // 5. Generate token and return response
        String token = jwtTokenUtil.generateToken(user.getId());
        UserPayload userPayload = convertToPayload(user);
        AuthResponse authResponse = new AuthResponse(userPayload, token);

        ApiResponse response = ApiResponse.builder()
                .success(true)
                .message("Authentication successful")
                .data(authResponse)
                .build();

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(@RequestBody LoginRequest request) {
        String email = request.getEmail();
        String password = request.getPassword();

        if (email == null || email.trim().isEmpty() ||
            password == null || password.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please provide email and password");
        }

        String cleanedEmail = email.toLowerCase().trim();
        User user = userRepository.findByEmail(cleanedEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect email or password"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect email or password");
        }

        String token = jwtTokenUtil.generateToken(user.getId());
        UserPayload userPayload = convertToPayload(user);
        AuthResponse authResponse = new AuthResponse(userPayload, token);

        ApiResponse response = ApiResponse.builder()
                .success(true)
                .message("Authentication successful")
                .data(authResponse)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "The user belonging to this token no longer exists.");
        }
        User user = principal.getUser();
        UserPayload userPayload = convertToPayload(user);

        ApiResponse response = ApiResponse.builder()
                .success(true)
                .message("User profile fetched successfully")
                .data(java.util.Map.of("user", userPayload))
                .build();

        return ResponseEntity.ok(response);
    }
}
