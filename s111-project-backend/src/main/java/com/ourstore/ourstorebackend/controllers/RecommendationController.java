package com.ourstore.ourstorebackend.controllers;

import com.ourstore.ourstorebackend.entities.Category;
import com.ourstore.ourstorebackend.entities.Product;
import com.ourstore.ourstorebackend.entities.User;
import com.ourstore.ourstorebackend.entities.Wishlist;
import com.ourstore.ourstorebackend.repositories.OrderRepository;
import com.ourstore.ourstorebackend.repositories.ProductRepository;
import com.ourstore.ourstorebackend.repositories.WishlistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/recommendations")
@CrossOrigin(origins = "*")
public class RecommendationController {

    @Autowired
    private WishlistRepository wishlistRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @GetMapping("/me")
    public List<Product> getRecommendationsForCurrentUser(@AuthenticationPrincipal User user) {
        Set<Category> preferredCategories = new HashSet<>();

        Wishlist wishlist = wishlistRepository.findByUser(user);
        if (wishlist != null) {
            wishlist.getProducts().forEach(p -> {
                if (p.getCategory() != null) {
                    preferredCategories.add(p.getCategory());
                }
            });
        }

        var orders = orderRepository.findByUser(user);
        orders.forEach(order -> order.getOrderItems().forEach(oi -> {
            Product p = oi.getProduct();
            if (p != null && p.getCategory() != null) {
                preferredCategories.add(p.getCategory());
            }
        }));

        List<Product> result = new ArrayList<>();
        if (!preferredCategories.isEmpty()) {
            for (Category category : preferredCategories) {
                List<Product> products = productRepository.findByCategory(category);
                for (Product p : products) {
                    if (!result.contains(p)) {
                        result.add(p);
                    }
                    if (result.size() >= 10) {
                        return result;
                    }
                }
            }
        }

        if (result.isEmpty()) {
            result = productRepository.findTop10ByOrderByAverageRatingDesc();
        }

        return result;
    }
}
