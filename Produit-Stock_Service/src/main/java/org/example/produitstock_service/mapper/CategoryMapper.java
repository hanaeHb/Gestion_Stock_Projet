package org.example.produitstock_service.mapper;

import org.example.produitstock_service.dto.CategoryRequestDTO;
import org.example.produitstock_service.dto.CategoryResponseDTO;
import org.example.produitstock_service.entity.Category;
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {

    public CategoryResponseDTO toResponseDTO(Category category) {
        if (category == null) return null;
        CategoryResponseDTO dto = new CategoryResponseDTO();
        dto.setId(category.getId());
        dto.setNom(category.getNom());
        dto.setDescription(category.getDescription());
        return dto;
    }

    public Category toEntity(CategoryRequestDTO dto) {
        if (dto == null) return null;
        Category category = new Category();
        category.setNom(dto.getNom());
        category.setDescription(dto.getDescription());
        return category;
    }
}