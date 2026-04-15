package org.example.produitstock_service.service.impl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.example.produitstock_service.dto.ProduitRequestDTO;
import org.example.produitstock_service.dto.ProduitResponseDTO;
import org.example.produitstock_service.dto.RestockRequestDTO;
import org.example.produitstock_service.entity.Category;
import org.example.produitstock_service.entity.Produit;
import org.example.produitstock_service.mapper.ProduitMapper;
import org.example.produitstock_service.repository.CategoryRepository;
import org.example.produitstock_service.repository.ProduitRepository;
import org.example.produitstock_service.service.ProduitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional

public class ProduitServiceImpl implements ProduitService {

    public ProduitServiceImpl(ProduitMapper produitMapper, ProduitRepository produitRepository, CategoryRepository categoryRepository) {
        this.produitMapper = produitMapper;
        this.produitRepository = produitRepository;
        this.categoryRepository = categoryRepository;
    }

    private final ProduitRepository produitRepository;
    private final ProduitMapper produitMapper;
    private  CategoryRepository categoryRepository;

    @Autowired
    private  KafkaTemplate<String, Object> kafkaTemplate;

    @Override
    public ProduitResponseDTO createProduit(ProduitRequestDTO request) {
        Produit produit = produitMapper.toEntity(request);
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Catégorie non trouvée"));
        produit.setCategory(category);
        Produit saved = produitRepository.save(produit);
        return produitMapper.toResponseDTO(saved);
    }

    @Override
    public ProduitResponseDTO updateProduit(Long id, ProduitRequestDTO request) {
        Produit produit = produitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé avec l'ID: " + id));

        // Mise à jour des infos de base
        produit.setSku(request.getSku());
        produit.setNom(request.getNom());
        produit.setDescription(request.getDescription());
        produit.setPrixUnitaire(request.getPrixUnitaire());
        produit.setImage(request.getImage());

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Catégorie non trouvée"));
            produit.setCategory(category);
        }
        if (produit.getStock() != null) {
            produit.getStock().setQuantiteDisponible(request.getQuantiteInitiale());
            produit.getStock().setSeuilCritique(request.getSeuilCritique());
        }
        return produitMapper.toResponseDTO(produitRepository.save(produit));
    }

    @Override
    public ProduitResponseDTO getProduitById(Long id) {
        return produitRepository.findById(id)
                .map(produitMapper::toResponseDTO)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé"));
    }

    @Override
    public List<ProduitResponseDTO> getProduitsByCategorie(Long categoryId) {
        return produitRepository.findByCategory_Id(categoryId).stream()
                .map(produitMapper::toResponseDTO)
                .collect(Collectors.toList());
    }
    @Override
    public ProduitResponseDTO getProduitBySku(String sku) {

        return produitRepository.findBySku(sku)
                .map(produitMapper::toResponseDTO)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé avec SKU: " + sku));
    }

    @Override
    public List<ProduitResponseDTO> getAllProduits() {
        return produitRepository.findAll().stream()
                .map(produitMapper::toResponseDTO)
                .collect(Collectors.toList());
    }


    @Override
    public void deleteProduit(Long id) {
        if (!produitRepository.existsById(id)) {
            throw new RuntimeException("Impossible de supprimer : Produit inexistant");
        }
        produitRepository.deleteById(id);
    }

    public void sendRestockRequest(RestockRequestDTO request) {
        try {

            Produit produit = produitRepository.findById(request.productId())
                    .orElseThrow(() -> new RuntimeException("Produit non trouvé"));

            String categoryName = (produit.getCategory() != null) ? produit.getCategory().getNom() : "Uncategorized";

            RestockRequestDTO enrichedRequest = new RestockRequestDTO(
                    request.productId(),
                    request.productName(),
                    request.requestedQty(),
                    request.fromManager(),
                    categoryName
            );

            kafkaTemplate.send("replenishment-requested", enrichedRequest);

            System.out.println("Message sent to Kafka with Category: " + categoryName);

        } catch (Exception e) {
            throw new RuntimeException("Error sending to Kafka: " + e.getMessage());
        }
    }

    @Override
    public void toggleProduitStatus(Long id) {
        Produit produit = produitRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Produit non trouvé"));

        // Désactivation logique (Soft Delete style)
        produit.setActive(!produit.isActive());
        produitRepository.save(produit);
    }
}