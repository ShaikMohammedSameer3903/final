package com.ourstore.ourstorebackend.controllers;

import com.ourstore.ourstorebackend.entities.*;
import com.ourstore.ourstorebackend.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "*")
public class CartController {

    @Autowired
    private ShoppingCartRepository shoppingCartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{userId}")
    public ShoppingCart getCart(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        ShoppingCart cart = shoppingCartRepository.findByUser(user);
        if (cart == null) {
            cart = new ShoppingCart();
            cart.setUser(user);
            cart = shoppingCartRepository.save(cart);
        }
        return cart;
    }

    @PostMapping("/{userId}/items")
    public ShoppingCart addItemToCart(@PathVariable Long userId, @RequestBody Map<String, Object> payload) {
        Long productId = ((Number) payload.get("productId")).longValue();
        int quantity = ((Number) payload.getOrDefault("quantity", 1)).intValue();

        User user = userRepository.findById(userId).orElseThrow();
        ShoppingCart cart = shoppingCartRepository.findByUser(user);
        if (cart == null) {
            cart = new ShoppingCart();
            cart.setUser(user);
        }

        Product product = productRepository.findById(productId).orElseThrow();

        List<CartItem> items = cartItemRepository.findByShoppingCart(cart);
        CartItem existingItem = items.stream()
                .filter(ci -> ci.getProduct().getId().equals(productId))
                .findFirst()
                .orElse(null);

        if (existingItem == null) {
            CartItem newItem = new CartItem();
            newItem.setShoppingCart(cart);
            newItem.setProduct(product);
            newItem.setQuantity(quantity);
            newItem.setUnitPrice(product.getPrice());
            cart.getCartItems().add(newItem);
        } else {
            existingItem.setQuantity(existingItem.getQuantity() + quantity);
        }

        recalculateCartTotals(cart);
        shoppingCartRepository.save(cart);
        return cart;
    }

    @DeleteMapping("/{userId}/items/{itemId}")
    public ShoppingCart removeItem(@PathVariable Long userId, @PathVariable Long itemId) {
        User user = userRepository.findById(userId).orElseThrow();
        ShoppingCart cart = shoppingCartRepository.findByUser(user);
        if (cart == null) {
            return null;
        }
        cart.getCartItems().removeIf(ci -> ci.getId().equals(itemId));
        cartItemRepository.deleteById(itemId);
        recalculateCartTotals(cart);
        shoppingCartRepository.save(cart);
        return cart;
    }

    @DeleteMapping("/{userId}")
    public Map<String, String> clearCart(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElseThrow();
        ShoppingCart cart = shoppingCartRepository.findByUser(user);
        if (cart != null) {
            cart.getCartItems().clear();
            cart.setTotalItems(0);
            cart.setTotalPrice(BigDecimal.ZERO);
            shoppingCartRepository.save(cart);
        }
        Map<String, String> resp = new HashMap<>();
        resp.put("message", "Cart cleared");
        return resp;
    }

    private void recalculateCartTotals(ShoppingCart cart) {
        int totalItems = 0;
        BigDecimal totalPrice = BigDecimal.ZERO;
        for (CartItem item : cart.getCartItems()) {
            totalItems += item.getQuantity();
            totalPrice = totalPrice.add(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        }
        cart.setTotalItems(totalItems);
        cart.setTotalPrice(totalPrice);
    }
}
