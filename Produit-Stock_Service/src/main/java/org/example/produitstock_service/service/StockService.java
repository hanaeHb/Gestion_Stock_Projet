package org.example.produitstock_service.service;

import org.example.produitstock_service.dto.StockRequestDTO;
import org.example.produitstock_service.dto.StockResponseDTO;
import java.util.List;

public interface StockService {
    // Kat-creer wala t-updati l-nivo dial stock
    StockResponseDTO updateStockLevel(StockRequestDTO request);

    StockResponseDTO getStockByProduitId(Long produitId);

    // Pour le Dashboard: chnu l-sel3a li khassna n-chriw (Alertes)
    List<StockResponseDTO> getStocksCritiques();

    void updateEmplacement(Long produitId, String newEmplacement);
}