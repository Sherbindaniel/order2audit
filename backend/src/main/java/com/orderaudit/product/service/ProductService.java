package com.orderaudit.product.service;

import com.orderaudit.common.exception.ResourceNotFoundException;
import com.orderaudit.product.dto.CreateProductRequest;
import com.orderaudit.product.dto.ProductCategoryDto;
import com.orderaudit.product.dto.ProductDto;
import com.orderaudit.product.entity.Product;
import com.orderaudit.product.entity.ProductCategory;
import com.orderaudit.product.repository.ProductCategoryRepository;
import com.orderaudit.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {
    private final ProductRepository productRepository;
    private final ProductCategoryRepository categoryRepository;

    public List<ProductDto> getAllProducts() {
        return productRepository.findByActiveTrue().stream().map(this::toDto).collect(Collectors.toList());
    }

    public ProductDto getProductById(Long id) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        return toDto(p);
    }

    public List<ProductDto> getProductsByCategory(Long categoryId) {
        return productRepository.findByCategoryId(categoryId).stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public ProductDto createProduct(CreateProductRequest request) {
        ProductCategory category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("ProductCategory", "id", request.getCategoryId()));
        }

        Product p = Product.builder()
                .name(request.getName())
                .sku(request.getSku() != null ? request.getSku() : generateSku(request.getName()))
                .category(category)
                .packSize(request.getPackSize())
                .packUnit(request.getPackUnit())
                .hsnCode(request.getHsnCode() != null ? request.getHsnCode() : "2106")
                .gstRate(request.getGstRate() != null ? request.getGstRate() : new BigDecimal("5.00"))
                .sellingPrice(request.getSellingPrice())
                .mrp(request.getMrp())
                .active(true)
                .build();

        return toDto(productRepository.save(p));
    }

    @Transactional
    public ProductDto updateProduct(Long id, CreateProductRequest request) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        if (request.getCategoryId() != null) {
            ProductCategory cat = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("ProductCategory", "id", request.getCategoryId()));
            p.setCategory(cat);
        }

        p.setName(request.getName());
        if (request.getSku() != null) p.setSku(request.getSku());
        p.setPackSize(request.getPackSize());
        p.setPackUnit(request.getPackUnit());
        if (request.getHsnCode() != null) p.setHsnCode(request.getHsnCode());
        if (request.getGstRate() != null) p.setGstRate(request.getGstRate());
        p.setSellingPrice(request.getSellingPrice());
        p.setMrp(request.getMrp());

        return toDto(productRepository.save(p));
    }

    public List<ProductCategoryDto> getAllCategories() {
        return categoryRepository.findAll().stream().map(c ->
                ProductCategoryDto.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .description(c.getDescription())
                        .build()
        ).collect(Collectors.toList());
    }

    @Transactional
    public ProductCategoryDto createCategory(ProductCategoryDto dto) {
        ProductCategory c = ProductCategory.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .build();
        ProductCategory saved = categoryRepository.save(c);
        return ProductCategoryDto.builder()
                .id(saved.getId())
                .name(saved.getName())
                .description(saved.getDescription())
                .build();
    }

    public ProductDto toDto(Product p) {
        return ProductDto.builder()
                .id(p.getId())
                .name(p.getName())
                .sku(p.getSku())
                .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
                .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                .packSize(p.getPackSize())
                .packUnit(p.getPackUnit())
                .hsnCode(p.getHsnCode())
                .gstRate(p.getGstRate())
                .sellingPrice(p.getSellingPrice())
                .mrp(p.getMrp())
                .active(p.isActive())
                .build();
    }

    private String generateSku(String name) {
        String clean = name.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        if (clean.length() > 6) clean = clean.substring(0, 6);
        return clean + "-" + System.currentTimeMillis() % 10000;
    }
}
