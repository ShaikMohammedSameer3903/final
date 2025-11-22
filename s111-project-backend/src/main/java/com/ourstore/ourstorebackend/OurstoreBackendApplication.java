package com.ourstore.ourstorebackend;

import com.ourstore.ourstorebackend.entities.User;
import com.ourstore.ourstorebackend.repositories.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class OurstoreBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(OurstoreBackendApplication.class, args);
    }

    // Ensure a default admin user exists so there is always an account
    // with full product management access.
    @Bean
    public CommandLineRunner initDefaultAdmin(UserRepository userRepository) {
        return args -> {
            User existing = userRepository.findByUsername("admin");
            if (existing == null) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword("admin123");
                admin.setEmail("admin@example.com");
                admin.setEnabled(true);
                userRepository.save(admin);
            }
        };
    }
}