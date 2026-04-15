package org.example.produitstock_service.service.impl;

import jakarta.transaction.Transactional;
import org.example.produitstock_service.dto.CategoryRequestDTO;
import org.example.produitstock_service.dto.CategoryResponseDTO;
import org.example.produitstock_service.entity.Category;
import org.example.produitstock_service.mapper.CategoryMapper;
import org.example.produitstock_service.repository.CategoryRepository;
import org.example.produitstock_service.service.CategoryService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    public CategoryServiceImpl(CategoryMapper categoryMapper, CategoryRepository categoryRepository) {
        this.categoryMapper = categoryMapper;
        this.categoryRepository = categoryRepository;
    }

    @Override
    public CategoryResponseDTO createCategory(CategoryRequestDTO request) {
        if(categoryRepository.existsByNom(request.getNom())) {
            throw new RuntimeException("deja existir");
        }

        Category category = categoryMapper.toEntity(request);
        Category saved = categoryRepository.save(category);
        return categoryMapper.toResponseDTO(saved);
    }

    @Override
    public CategoryResponseDTO updateCategory(Long id, CategoryRequestDTO request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category non trouvée avec l'ID: " + id));

        category.setNom(request.getNom());
        category.setDescription(request.getDescription());

        return categoryMapper.toResponseDTO(categoryRepository.save(category));
    }

    @Override
    public CategoryResponseDTO getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .map(categoryMapper::toResponseDTO)
                .orElseThrow(() -> new RuntimeException("Category non trouvée"));
    }

    @Override
    public List<CategoryResponseDTO> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(categoryMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Impossible de supprimer : Category inexistante"));

        if (!category.getProduits().isEmpty()) {
            throw new RuntimeException("Impossible de supprimer la catégorie car elle contient des produits associés.");
        }

        categoryRepository.deleteById(id);
    }
}