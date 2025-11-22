package com.ourstore.ourstorebackend.repositories;

import com.ourstore.ourstorebackend.entities.CartItem;
import com.ourstore.ourstorebackend.entities.ShoppingCart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByShoppingCart(ShoppingCart shoppingCart);
}
