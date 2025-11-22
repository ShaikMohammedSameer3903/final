package com.ourstore.ourstorebackend.controllers;

import com.ourstore.ourstorebackend.entities.User;
import com.ourstore.ourstorebackend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

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
        userRepository.save(user);
        response.put("message", "Registration successful!");
        return response;
    }

    @PostMapping("/login")
    public Map<String, String> loginUser(@RequestBody User user) {
        Map<String, String> response = new HashMap<>();
        User foundUser = userRepository.findByUsernameAndPassword(user.getUsername(), user.getPassword());

        if (foundUser != null) {
            response.put("message", "Login successful!");
            response.put("userId", foundUser.getId().toString());
            // Simple admin check: username 'admin' is treated as admin
            if ("admin".equalsIgnoreCase(foundUser.getUsername())) {
                response.put("isAdmin", "true");
            } else {
                response.put("isAdmin", "false");
            }
            return response;
        }

        response.put("message", "Invalid credentials.");
        return response;
    }

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