package org.example.produitstock_service.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.example.produitstock_service.dto.StockResponseDTO;
import org.example.produitstock_service.service.StockService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Stocks", description = "API pour le suivi des niveaux de stock")
@RestController
@RequestMapping("/v1/stocks")
public class StockController {
    public StockController(StockService stockService) {
        this.stockService = stockService;
    }

    private final StockService stockService;

    @Operation(summary = "Obtenir le stock d'un produit spécifique")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','GESTIONNAIRE_DE_STOCK','RESPONSABLE_DES_ACHATS')")
    @GetMapping("/produit/{produitId}")
    public ResponseEntity<StockResponseDTO> getStockByProduit(@PathVariable Long produitId) {
        return ResponseEntity.ok(stockService.getStockByProduitId(produitId));
    }

    @Operation(summary = "Lister les produits en seuil critique (Alertes)")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','RESPONSABLE_DES_ACHATS')")
    @GetMapping("/alertes")
    public ResponseEntity<List<StockResponseDTO>> getStocksCritiques() {
        return ResponseEntity.ok(stockService.getStocksCritiques());
    }

    @Operation(summary = "Mettre à jour l'emplacement d'un produit")
    @PreAuthorize("hasRole('GESTIONNAIRE_DE_STOCK')")
    @PatchMapping("/produit/{produitId}/emplacement")
    public ResponseEntity<Void> updateEmplacement(@PathVariable Long produitId, @RequestParam String emplacement) {
        stockService.updateEmplacement(produitId, emplacement);
        return ResponseEntity.ok().build();
    }
}