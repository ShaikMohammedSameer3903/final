package com.ourstore.ourstorebackend.controllers;

import com.ourstore.ourstorebackend.entities.Product;
import com.ourstore.ourstorebackend.entities.User;
import com.ourstore.ourstorebackend.entities.Wishlist;
import com.ourstore.ourstorebackend.repositories.ProductRepository;
import com.ourstore.ourstorebackend.repositories.UserRepository;
import com.ourstore.ourstorebackend.repositories.WishlistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
@CrossOrigin(origins = "*")
public class WishlistController {

    @Autowired
    private WishlistRepository wishlistRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @GetMapping("/{userId}")
    public Wishlist getWishlist(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        Wishlist wishlist = wishlistRepository.findByUser(user);
        if (wishlist == null) {
            wishlist = new Wishlist();
            wishlist.setUser(user);
            wishlist = wishlistRepository.save(wishlist);
        }
        return wishlist;
    }

    @PostMapping("/add/{userId}")
    public Wishlist addToWishlist(@PathVariable Long userId, @RequestBody Map<String, Object> payload) {
        Long productId = ((Number) payload.get("productId")).longValue();
        User user = userRepository.findById(userId).orElseThrow();
        Wishlist wishlist = wishlistRepository.findByUser(user);
        if (wishlist == null) {
            wishlist = new Wishlist();
            wishlist.setUser(user);
        }
        Product product = productRepository.findById(productId).orElseThrow();
        wishlist.getProducts().add(product);
        return wishlistRepository.save(wishlist);
    }

    @DeleteMapping("/{userId}/items/{productId}")
    public Wishlist removeFromWishlist(@PathVariable Long userId, @PathVariable Long productId) {
        User user = userRepository.findById(userId).orElseThrow();
        Wishlist wishlist = wishlistRepository.findByUser(user);
        if (wishlist == null) {
            return null;
        }
        wishlist.getProducts().removeIf(p -> p.getId().equals(productId));
        return wishlistRepository.save(wishlist);
    }

    @DeleteMapping("/{userId}")
    public Map<String, String> clearWishlist(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        Wishlist wishlist = wishlistRepository.findByUser(user);
        if (wishlist != null) {
            wishlist.getProducts().clear();
            wishlistRepository.save(wishlist);
        }
        Map<String, String> resp = new HashMap<>();
        resp.put("message", "Wishlist cleared");
        return resp;
    }
}
