package com.ourstore.ourstorebackend.repositories;

import com.ourstore.ourstorebackend.entities.ShoppingCart;
import com.ourstore.ourstorebackend.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShoppingCartRepository extends JpaRepository<ShoppingCart, Long> {
    ShoppingCart findByUser(User user);
}
