package org.example.produitstock_service.mapper;

import org.example.produitstock_service.dto.StockRequestDTO;
import org.example.produitstock_service.dto.StockResponseDTO;
import org.example.produitstock_service.entity.Produit;
import org.example.produitstock_service.entity.Stock;
import org.springframework.stereotype.Component;

@Component
public class StockMapper {

    public StockResponseDTO toResponseDTO(Stock stock) {
        if (stock == null) return null;

        StockResponseDTO dto = new StockResponseDTO();
        dto.setIdStock(stock.getIdStock());
        dto.setQuantiteDisponible(stock.getQuantiteDisponible());
        dto.setSeuilCritique(stock.getSeuilCritique());
        dto.setEmplacement(stock.getEmplacement());
        dto.setDateDerniereMiseAJour(stock.getDateDerniereMiseAJour());

        if (stock.getProduit() != null) {
            dto.setProduitId(stock.getProduit().getId());
            dto.setProduitNom(stock.getProduit().getNom());
        }

        return dto;
    }

    public Stock toEntity(StockRequestDTO dto, Produit produit) {
        if (dto == null) return null;

        Stock stock = new Stock();
        stock.setQuantiteDisponible(dto.getQuantiteDisponible());
        stock.setSeuilCritique(dto.getSeuilCritique());
        stock.setEmplacement(dto.getEmplacement());
        stock.setDateDerniereMiseAJour(java.time.LocalDate.now());
        stock.setProduit(produit);

        return stock;
    }
}