package org.example.produitstock_service.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.produitstock_service.dto.ProduitRequestDTO;
import org.example.produitstock_service.dto.ProduitResponseDTO;
import org.example.produitstock_service.dto.RestockRequestDTO;
import org.example.produitstock_service.service.ProduitService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Produits", description = "API pour la gestion du catalogue des produits")
@RestController
@RequestMapping("/v1/produits")
public class ProduitController {
    public ProduitController(ProduitService produitService) {
        this.produitService = produitService;
    }

    private final ProduitService produitService;

    @Operation(summary = "Ajouter un nouveau produit au catalogue")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    @PostMapping("/create")
    public ResponseEntity<ProduitResponseDTO> create(@Valid @RequestBody ProduitRequestDTO request) {
        return new ResponseEntity<>(produitService.createProduit(request), HttpStatus.CREATED);
    }

    @Operation(summary = "Modifier les informations d'un produit")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    @PutMapping("/{id}")
    public ResponseEntity<ProduitResponseDTO> update(@PathVariable Long id, @Valid @RequestBody ProduitRequestDTO request) {
        return ResponseEntity.ok(produitService.updateProduit(id, request));
    }

    @Operation(summary = "Rechercher un produit par son ID")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'INVENTORY_MANAGER', 'RESPONSABLE_DES_ACHATS')")
    public ResponseEntity<ProduitResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(produitService.getProduitById(id));
    }

    @Operation(summary = "Rechercher un produit par son code SKU")
    @GetMapping("/sku/{sku}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'INVENTORY_MANAGER')")
    public ResponseEntity<ProduitResponseDTO> getBySku(@PathVariable String sku) {
        return ResponseEntity.ok(produitService.getProduitBySku(sku));
    }

    @Operation(summary = "Lister tous les produits du catalogue")
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'INVENTORY_MANAGER', 'RESPONSABLE_DES_ACHATS')")
    public ResponseEntity<List<ProduitResponseDTO>> getAll() {
        return ResponseEntity.ok(produitService.getAllProduits());
    }

    @Operation(summary = "Filtrer les produits par ID de catégorie")
    @GetMapping("/categorie/{categoryId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'RESPONSABLE_DES_ACHATS', 'INVENTORY_MANAGER')")
    public ResponseEntity<List<ProduitResponseDTO>> getByCategorie(@PathVariable Long categoryId) {
        return ResponseEntity.ok(produitService.getProduitsByCategorie(categoryId));
    }

    @Operation(summary = "Envoyer une demande de réapprovisionnement via Kafka")
    @PreAuthorize("hasRole('INVENTORY_MANAGER')")
    @PostMapping("/request-restock")
    public ResponseEntity<Void> requestRestock(@RequestBody RestockRequestDTO request) {
        produitService.sendRestockRequest(request);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Activer ou désactiver un produit (Soft Delete)")
    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> toggleStatus(@PathVariable Long id) {
        produitService.toggleProduitStatus(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Supprimer définitivement un produit")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        produitService.deleteProduit(id);
        return ResponseEntity.noContent().build();
    }
}