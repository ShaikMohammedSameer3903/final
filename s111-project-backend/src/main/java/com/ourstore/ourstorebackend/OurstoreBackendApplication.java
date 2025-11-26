package com.ourstore.ourstorebackend;

import com.ourstore.ourstorebackend.entities.Role;
import com.ourstore.ourstorebackend.entities.User;
import com.ourstore.ourstorebackend.entities.Product;
import com.ourstore.ourstorebackend.repositories.RoleRepository;
import com.ourstore.ourstorebackend.repositories.UserRepository;
import com.ourstore.ourstorebackend.repositories.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

/**
 * Ourstore Backend Application
 */
@SpringBootApplication
public class OurstoreBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(OurstoreBackendApplication.class, args);
    }

    // Ensure a default admin user exists so there is always an account
    // with full product management access.
    @Bean
    public CommandLineRunner initDefaultAdmin(UserRepository userRepository,
                                              RoleRepository roleRepository,
                                              PasswordEncoder passwordEncoder) {
        return args -> {
            Role adminRole = roleRepository.findByName(Role.RoleName.ROLE_ADMIN)
                    .orElseGet(() -> {
                        Role role = new Role();
                        role.setName(Role.RoleName.ROLE_ADMIN);
                        role.setDescription("Administrator role");
                        return roleRepository.save(role);
                    });

            User existing = userRepository.findByUsername("admin");
            if (existing == null) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setEmail("admin@example.com");
                admin.setEnabled(true);
                Set<Role> roles = new HashSet<>();
                roles.add(adminRole);
                admin.setRoles(roles);
                userRepository.save(admin);
            } else {
                existing.setPassword(passwordEncoder.encode("admin123"));
                Set<Role> roles = existing.getRoles();
                if (roles == null) {
                    roles = new HashSet<>();
                }
                roles.add(adminRole);
                existing.setRoles(roles);
                userRepository.save(existing);
            }
        };
    }

    @Bean
    public CommandLineRunner initSampleProducts(ProductRepository productRepository) {
        return args -> {
            if (productRepository.count() == 0) {
                Product[] samples = new Product[] {
                        makeProduct("iPhone 15 Pro", "Latest Apple flagship smartphone.", 1299.00, 50, "IP15PRO", "https://picsum.photos/seed/iphone15pro/400/300"),
                        makeProduct("Samsung Galaxy S24", "Premium Android smartphone.", 1099.00, 60, "SGS24", "https://picsum.photos/seed/galaxys24/400/300"),
                        makeProduct("OnePlus 12", "Fast and smooth performance.", 899.00, 80, "OP12", "https://picsum.photos/seed/oneplus12/400/300"),
                        makeProduct("MacBook Air M2", "Ultra−light laptop with M2 chip.", 1499.00, 30, "MBA-M2", "https://picsum.photos/seed/mba-m2/400/300"),
                        makeProduct("Dell XPS 13", "Compact and powerful ultrabook.", 1399.00, 25, "DXPS13", "https://picsum.photos/seed/dellxps13/400/300"),
                        makeProduct("Sony WH-1000XM5", "Industry-leading noise cancelling headphones.", 399.00, 120, "SONYXM5", "https://picsum.photos/seed/sony1000xm5/400/300"),
                        makeProduct("Apple Watch Series 9", "Advanced health features.", 499.00, 75, "AWS9", "https://picsum.photos/seed/watchs9/400/300"),
                        makeProduct("Nintendo Switch OLED", "Hybrid gaming console.", 349.00, 90, "NSOLED", "https://picsum.photos/seed/switcholed/400/300"),
                        makeProduct("Canon EOS R50", "Mirrorless camera for creators.", 799.00, 40, "CER50", "https://picsum.photos/seed/canonr50/400/300"),
                        makeProduct("Logitech MX Master 3S", "Ergonomic wireless mouse.", 129.00, 150, "LGMX3S", "https://picsum.photos/seed/mxmaster3s/400/300"),
                        makeProduct("Nike Air Zoom Pegasus", "Comfortable running shoes.", 129.00, 200, "NAZP", "https://picsum.photos/seed/pegasus/400/300"),
                        makeProduct("Instant Pot Duo", "7-in-1 electric pressure cooker.", 99.00, 110, "IPDUO", "https://picsum.photos/seed/instantpot/400/300")
                };
                for (Product p : samples) {
                    productRepository.save(p);
                }
            }
        };
    }

    private static Product makeProduct(String name, String description, double price,
                                       int stock, String sku, String imageUrl) {
        Product p = new Product();
        p.setName(name);
        p.setDescription(description);
        p.setPrice(BigDecimal.valueOf(price));
        p.setStockQuantity(stock);
        p.setSku(sku);
        p.setImageUrl(imageUrl);
        p.setActive(true);
        return p;
    }
}