package com.ourstore.ourstorebackend.controllers;

import com.ourstore.ourstorebackend.entities.Role;
import com.ourstore.ourstorebackend.entities.User;
import com.ourstore.ourstorebackend.repositories.RoleRepository;
import com.ourstore.ourstorebackend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.ourstore.ourstorebackend.security.JwtTokenProvider;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @PostMapping("/register")
    public Map<String, String> registerUser(@RequestBody User user) {
        Map<String, String> response = new HashMap<>();
        User existingUser = userRepository.findByUsername(user.getUsername());
        if (existingUser != null) {
            response.put("message", "User already exists.");
            return response;
        }
        // If email is not provided, generate a simple default to satisfy DB constraints
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            user.setEmail(user.getUsername() + "@example.com");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        Role userRole = roleRepository.findByName(Role.RoleName.ROLE_USER)
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setName(Role.RoleName.ROLE_USER);
                    role.setDescription("Default user role");
                    return roleRepository.save(role);
                });

        Set<Role> roles = new HashSet<>();
        roles.add(userRole);
        user.setRoles(roles);

        userRepository.save(user);
        response.put("message", "Registration successful!");
        return response;
    }

    @PostMapping("/login")
    public Map<String, String> loginUser(@RequestBody User user) {
        Map<String, String> response = new HashMap<>();
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(user.getUsername(), user.getPassword())
            );

            String token = jwtTokenProvider.generateToken(authentication);
            User authenticatedUser = (User) authentication.getPrincipal();

            boolean isAdmin = authenticatedUser.getRoles().stream()
                    .anyMatch(role -> role.getName() == Role.RoleName.ROLE_ADMIN);

            response.put("message", "Login successful!");
            response.put("token", token);
            response.put("userId", authenticatedUser.getId().toString());
            response.put("isAdmin", Boolean.toString(isAdmin));
            return response;
        } catch (BadCredentialsException ex) {
            response.put("message", "Invalid credentials.");
            return response;
        }
    }

    @GetMapping("/me")
    public Map<String, Object> getCurrentUserProfile(@AuthenticationPrincipal User user) {
        Map<String, Object> resp = new HashMap<>();
        resp.put("id", user.getId());
        resp.put("username", user.getUsername());
        resp.put("email", user.getEmail());
        resp.put("firstName", user.getFirstName());
        resp.put("lastName", user.getLastName());
        resp.put("phoneNumber", user.getPhoneNumber());
        resp.put("address", user.getAddress());
        resp.put("city", user.getCity());
        resp.put("postalCode", user.getPostalCode());
        resp.put("country", user.getCountry());
        resp.put("dateCreated", user.getDateCreated());
        return resp;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public Map<String, Object> getUserProfile(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow();
        Map<String, Object> resp = new HashMap<>();
        resp.put("id", user.getId());
        resp.put("username", user.getUsername());
        resp.put("email", user.getEmail());
        resp.put("firstName", user.getFirstName());
        resp.put("lastName", user.getLastName());
        resp.put("phoneNumber", user.getPhoneNumber());
        resp.put("address", user.getAddress());
        resp.put("city", user.getCity());
        resp.put("postalCode", user.getPostalCode());
        resp.put("country", user.getCountry());
        resp.put("dateCreated", user.getDateCreated());
        return resp;
    }
}