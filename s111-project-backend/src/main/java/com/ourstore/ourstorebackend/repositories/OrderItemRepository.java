package com.ourstore.ourstorebackend.repositories;

import com.ourstore.ourstorebackend.entities.OrderItem;
import com.ourstore.ourstorebackend.entities.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrder(Order order);
}
