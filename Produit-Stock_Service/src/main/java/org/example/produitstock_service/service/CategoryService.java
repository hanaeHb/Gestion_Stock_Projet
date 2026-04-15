package org.example.produitstock_service.service;

import org.example.produitstock_service.dto.CategoryRequestDTO;
import org.example.produitstock_service.dto.CategoryResponseDTO;
import java.util.List;

public interface CategoryService {
    CategoryResponseDTO createCategory(CategoryRequestDTO request);
    CategoryResponseDTO updateCategory(Long id, CategoryRequestDTO request);
    CategoryResponseDTO getCategoryById(Long id);
    List<CategoryResponseDTO> getAllCategories();
    void deleteCategory(Long id);
}