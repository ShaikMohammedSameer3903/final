package com.ourstore.ourstorebackend.controllers;

import com.ourstore.ourstorebackend.entities.Product;
import com.ourstore.ourstorebackend.repositories.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Random;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @PostMapping
    public Product addProduct(@RequestBody Product product) {
        return productRepository.save(product);
    }
    
    @DeleteMapping("/{id}")
    public void deleteProduct(@PathVariable Long id) {
        productRepository.deleteById(id);
    }
    
    @PostMapping("/add-dummy-data")
    public String addDummyData() {
        if (productRepository.count() == 0) {
            Random random = new Random();
            for (int i = 1; i <= 10; i++) {
                Product product = new Product();
                product.setName("Product " + i);
                product.setDescription("A great description for product " + i + ".");
                double randomPrice = random.nextDouble() * 100 + 10;
                product.setPrice(BigDecimal.valueOf(randomPrice));
                product.setStockQuantity(50);
                product.setSku("SKU-" + i);
                product.setImageUrl("https://via.placeholder.com/400x300?text=Product+" + i);
                product.setActive(true);
                productRepository.save(product);
            }
            return "Dummy data added successfully.";
        }
        return "Products already exist, no dummy data added.";
    }
}