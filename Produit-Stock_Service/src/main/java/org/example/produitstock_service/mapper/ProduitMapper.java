package org.example.produitstock_service.mapper;

import org.example.produitstock_service.dto.ProduitRequestDTO;
import org.example.produitstock_service.dto.ProduitResponseDTO;
import org.example.produitstock_service.entity.Produit;
import org.example.produitstock_service.entity.Stock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.time.LocalDate;

@Component
public class ProduitMapper {

    @Autowired
    private CategoryMapper categoryMapper;
    public ProduitResponseDTO toResponseDTO(Produit produit) {
        if (produit == null) return null;

        ProduitResponseDTO dto = new ProduitResponseDTO();
        dto.setId(produit.getId());
        dto.setSku(produit.getSku());
        dto.setNom(produit.getNom());
        dto.setDescription(produit.getDescription());
        dto.setPrixUnitaire(produit.getPrixUnitaire());
        dto.setImage(produit.getImage());
        dto.setActive(produit.isActive());

        if (produit.getCategory() != null) {
            dto.setCategory(categoryMapper.toResponseDTO(produit.getCategory()));
        }

        if (produit.getStock() != null) {
            dto.setQuantiteDisponible(produit.getStock().getQuantiteDisponible());
            dto.setSeuilCritique(produit.getStock().getSeuilCritique());
        }

        return dto;
    }

    public Produit toEntity(ProduitRequestDTO dto) {
        if (dto == null) return null;

        Produit produit = new Produit();
        produit.setSku(dto.getSku());
        produit.setNom(dto.getNom());
        produit.setDescription(dto.getDescription());
        produit.setPrixUnitaire(dto.getPrixUnitaire());
        produit.setImage(dto.getImage());
        produit.setActive(true);

        Stock stock = new Stock();
        stock.setQuantiteDisponible(dto.getQuantiteInitiale());
        stock.setSeuilCritique(dto.getSeuilCritique());
        stock.setDateDerniereMiseAJour(LocalDate.now());
        stock.setProduit(produit);

        produit.setStock(stock);

        return produit;
    }
}