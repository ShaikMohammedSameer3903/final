package com.ourstore.ourstorebackend.controllers;

import com.ourstore.ourstorebackend.entities.Product;
import com.ourstore.ourstorebackend.entities.Review;
import com.ourstore.ourstorebackend.entities.User;
import com.ourstore.ourstorebackend.repositories.ProductRepository;
import com.ourstore.ourstorebackend.repositories.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ProductRepository productRepository;

    @PostMapping("/reviews")
    public Map<String, Object> addReview(@AuthenticationPrincipal User user,
                                         @RequestBody Map<String, Object> payload) {
        Long productId = ((Number) payload.get("productId")).longValue();
        Integer rating = ((Number) payload.get("rating")).intValue();
        String comment = (String) payload.getOrDefault("comment", "");

        Product product = productRepository.findById(productId).orElseThrow();

        Review review = new Review();
        review.setUser(user);
        review.setProduct(product);
        review.setRating(rating);
        review.setComment(comment);
        reviewRepository.save(review);

        Integer oldCount = product.getReviewCount() == null ? 0 : product.getReviewCount();
        Double oldAvg = product.getAverageRating() == null ? 0.0 : product.getAverageRating();
        double newAvg = ((oldAvg * oldCount) + rating) / (oldCount + 1);
        product.setReviewCount(oldCount + 1);
        product.setAverageRating(newAvg);
        productRepository.save(product);

        Map<String, Object> resp = new HashMap<>();
        resp.put("message", "Review added");
        resp.put("reviewId", review.getId());
        return resp;
    }

    @GetMapping("/products/{productId}/reviews")
    public List<Review> getReviewsForProduct(@PathVariable Long productId) {
        Product product = productRepository.findById(productId).orElseThrow();
        return reviewRepository.findByProduct(product);
    }
}
