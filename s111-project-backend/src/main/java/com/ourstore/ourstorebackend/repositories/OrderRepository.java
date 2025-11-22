package com.ourstore.ourstorebackend.repositories;

import com.ourstore.ourstorebackend.entities.Order;
import com.ourstore.ourstorebackend.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUser(User user);
}
