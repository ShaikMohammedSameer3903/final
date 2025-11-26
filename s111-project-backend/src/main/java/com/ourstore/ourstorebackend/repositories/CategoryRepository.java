package com.ourstore.ourstorebackend.repositories;

import com.ourstore.ourstorebackend.entities.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
}
