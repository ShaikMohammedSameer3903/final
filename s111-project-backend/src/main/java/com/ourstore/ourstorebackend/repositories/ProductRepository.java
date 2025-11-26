package com.ourstore.ourstorebackend.repositories;

import com.ourstore.ourstorebackend.entities.Category;
import com.ourstore.ourstorebackend.entities.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findTop10ByOrderByAverageRatingDesc();
    List<Product> findByCategory(Category category);
}