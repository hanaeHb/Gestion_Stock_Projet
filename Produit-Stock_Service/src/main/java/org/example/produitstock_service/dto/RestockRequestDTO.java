package org.example.produitstock_service.dto;

public record RestockRequestDTO(
        Long productId,
        String productName,
        Integer requestedQty,
        String fromManager,
        String category,
        Long categoryId,
        String sku,
        String productImage
) {}
