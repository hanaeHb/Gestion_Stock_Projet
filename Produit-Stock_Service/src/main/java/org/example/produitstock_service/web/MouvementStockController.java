package org.example.produitstock_service.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.produitstock_service.dto.MouvementStockRequestDTO;
import org.example.produitstock_service.dto.MouvementStockResponseDTO;
import org.example.produitstock_service.dto.ReceptionRequestDTO;
import org.example.produitstock_service.service.MouvementStockService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Mouvements", description = "API pour l'historique des entrées et sorties")
@RestController
@RequestMapping("/v1/mouvements")
public class MouvementStockController {

    public MouvementStockController(MouvementStockService mouvementService) {
        this.mouvementService = mouvementService;
    }

    private final MouvementStockService mouvementService;

    @Operation(summary = "Enregistrer un nouveau mouvement (Entrée/Sortie)")
    @PreAuthorize("hasAnyRole('ADMIN','Procurement Manager')")
    @PostMapping
    public ResponseEntity<MouvementStockResponseDTO> addMouvement(@Valid @RequestBody MouvementStockRequestDTO request) {
        return ResponseEntity.status(201).body(mouvementService.addMouvement(request));
    }

    @Operation(summary = "Confirmer la réception d'une commande (Mise à jour Stock + Budget)")
    @PreAuthorize("hasRole('Procurement Manager')")
    @PostMapping("/confirm-reception")
    public ResponseEntity<String> confirmReception(@Valid @RequestBody ReceptionRequestDTO request) {
        mouvementService.processOrderReception(request);
        return ResponseEntity.ok("Réception confirmée avec succès !");
    }

    @Operation(summary = "Consulter l'historique des mouvements d'un produit")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','Procurement Manager')")
    @GetMapping("/produit/{produitId}")
    public ResponseEntity<List<MouvementStockResponseDTO>> getHistory(@PathVariable Long produitId) {
        return ResponseEntity.ok(mouvementService.getMouvementsByProduitId(produitId));
    }

    @Operation(summary = "Lister tous les mouvements (Audit)")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<MouvementStockResponseDTO>> getAll() {
        return ResponseEntity.ok(mouvementService.getAllMouvements());
    }
}