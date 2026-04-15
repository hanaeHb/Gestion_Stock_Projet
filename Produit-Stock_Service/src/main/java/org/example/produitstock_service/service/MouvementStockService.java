package org.example.produitstock_service.service;

import org.example.produitstock_service.dto.MouvementStockRequestDTO;
import org.example.produitstock_service.dto.MouvementStockResponseDTO;
import org.example.produitstock_service.dto.ReceptionRequestDTO;

import java.util.List;

public interface MouvementStockService {

    MouvementStockResponseDTO addMouvement(MouvementStockRequestDTO request);

    List<MouvementStockResponseDTO> getAllMouvements();
    List<MouvementStockResponseDTO> getMouvementsByProduitId(Long produitId);

    List<MouvementStockResponseDTO> getMouvementsByType(String type);
    void processOrderReception(ReceptionRequestDTO request);
}