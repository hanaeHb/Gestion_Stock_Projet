package org.example.produitstock_service.service;

import org.example.produitstock_service.dto.ProduitRequestDTO;
import org.example.produitstock_service.dto.ProduitResponseDTO;
import org.example.produitstock_service.dto.RestockRequestDTO;

import java.util.List;

public interface ProduitService {
    ProduitResponseDTO createProduit(ProduitRequestDTO request);
    ProduitResponseDTO updateProduit(Long id, ProduitRequestDTO request);
    ProduitResponseDTO getProduitById(Long id);


    ProduitResponseDTO getProduitBySku(String sku);

    List<ProduitResponseDTO> getAllProduits();
    List<ProduitResponseDTO> getProduitsByCategorie(Long categoryId);

    void deleteProduit(Long id);
    void toggleProduitStatus(Long id);

    void sendRestockRequest(RestockRequestDTO request);
}