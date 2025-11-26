package com.ourstore.ourstorebackend.repositories;

import com.ourstore.ourstorebackend.entities.Product;
import com.ourstore.ourstorebackend.entities.Review;
import com.ourstore.ourstorebackend.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProduct(Product product);
    List<Review> findByUser(User user);
}
