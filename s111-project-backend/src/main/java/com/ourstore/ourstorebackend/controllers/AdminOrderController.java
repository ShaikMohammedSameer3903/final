package com.ourstore.ourstorebackend.controllers;

import com.ourstore.ourstorebackend.entities.Order;
import com.ourstore.ourstorebackend.repositories.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/orders")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    @Autowired
    private OrderRepository orderRepository;

    @GetMapping
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @GetMapping("/{id}")
    public Order getOrder(@PathVariable Long id) {
        return orderRepository.findById(id).orElseThrow();
    }

    @PutMapping("/{id}/status")
    public Map<String, Object> updateOrderStatus(@PathVariable Long id,
                                                 @RequestBody Map<String, String> payload) {
        String statusStr = payload.get("status");
        Order order = orderRepository.findById(id).orElseThrow();
        Order.OrderStatus newStatus = Order.OrderStatus.valueOf(statusStr);
        order.setStatus(newStatus);
        orderRepository.save(order);
        Map<String, Object> resp = new HashMap<>();
        resp.put("message", "Order status updated");
        resp.put("orderId", order.getId());
        resp.put("status", order.getStatus());
        return resp;
    }
}
