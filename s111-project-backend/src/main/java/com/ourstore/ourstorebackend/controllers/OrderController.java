package com.ourstore.ourstorebackend.controllers;

import com.ourstore.ourstorebackend.entities.*;
import com.ourstore.ourstorebackend.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private ShoppingCartRepository shoppingCartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{userId}")
    public List<Order> getOrders(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        return orderRepository.findByUser(user);
    }

    @PostMapping("/{userId}")
    public Map<String, Object> placeOrder(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        ShoppingCart cart = shoppingCartRepository.findByUser(user);
        Map<String, Object> resp = new HashMap<>();
        if (cart == null || cart.getCartItems().isEmpty()) {
            resp.put("message", "Cart is empty");
            return resp;
        }

        Order order = new Order();
        order.setUser(user);
        order.setOrderDate(LocalDateTime.now());
        order.setStatus(Order.OrderStatus.PENDING);

        BigDecimal totalPrice = BigDecimal.ZERO;
        int totalQty = 0;

        for (CartItem ci : cart.getCartItems()) {
            OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setProduct(ci.getProduct());
            oi.setQuantity(ci.getQuantity());
            oi.setUnitPrice(ci.getUnitPrice());
            order.getOrderItems().add(oi);
            totalQty += ci.getQuantity();
            totalPrice = totalPrice.add(ci.getUnitPrice().multiply(BigDecimal.valueOf(ci.getQuantity())));
        }

        order.setTotalQuantity(totalQty);
        order.setTotalPrice(totalPrice);
        orderRepository.save(order);

        // Clear cart
        cart.getCartItems().clear();
        cart.setTotalItems(0);
        cart.setTotalPrice(BigDecimal.ZERO);
        shoppingCartRepository.save(cart);

        resp.put("message", "Order placed successfully");
        resp.put("orderId", order.getId());
        return resp;
    }
}
