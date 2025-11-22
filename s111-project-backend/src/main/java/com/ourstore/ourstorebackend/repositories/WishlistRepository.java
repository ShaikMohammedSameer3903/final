package com.ourstore.ourstorebackend.repositories;

import com.ourstore.ourstorebackend.entities.User;
import com.ourstore.ourstorebackend.entities.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    Wishlist findByUser(User user);
}
