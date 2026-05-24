package org.example.budgetstock.web;


import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.budgetstock.dto.BudgetRequestDTO;
import org.example.budgetstock.dto.BudgetResponseDTO;
import org.example.budgetstock.service.IBudgetService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/v1/budgets")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Budget Management", description = "Endpoints for managing and checking purchasing budgets")
public class BudgetController {

    private final IBudgetService budgetService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new budget period")
    public ResponseEntity<BudgetResponseDTO> create(@Valid @RequestBody BudgetRequestDTO request) {
        log.info("[ADMIN] Tentative de création d'une nouvelle période budgétaire.");
        BudgetResponseDTO response = budgetService.createBudget(request);
        log.info("✅ Période budgétaire créée avec succès.");
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/current")
    @PreAuthorize("hasAnyRole('ADMIN','Procurement Manager')")
    @Operation(summary = "Get the active budget for the current date")
    public ResponseEntity<BudgetResponseDTO> getCurrent() {
        log.info("[API] Consultation du budget actif actuel");
        return ResponseEntity.ok(budgetService.getActiveBudget());
    }
    @GetMapping
    @Operation(summary = "Get all budget history")
    public ResponseEntity<List<BudgetResponseDTO>> getAll() {
        log.info("[API] Récupération de l'historique complet des budgets");
        return ResponseEntity.ok(budgetService.getAllBudgets());
    }
    @PostMapping("/check-consume")
    @Operation(summary = "Check if budget is sufficient and consume it")
    public ResponseEntity<String> consume(@RequestBody BigDecimal amount) {
        log.info("[System Pipeline] Vérification de la disponibilité du budget pour un montant de: {} DH", amount);
        boolean success = budgetService.checkAndConsumeBudget(amount);
        if (success) {
            log.info("✅ [System Pipeline] Budget consommé avec succès pour un montant de: {} DH", amount);
            return ResponseEntity.ok("Budget consumed successfully");
        } else {
            log.warn("⚠️ [System Pipeline] Échec de consommation: Budget insuffisant pour l'opération de {} DH !", amount);
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED)
                    .body("Insufficient budget for this operation");
        }
    }
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        log.warn("[ADMIN] Tentative de suppression définitive du budget ID: {}", id);
        budgetService.deleteBudget(id);
        log.info("✅ Budget ID: {} supprimé avec succès.", id);
        return ResponseEntity.noContent().build();
    }
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update an existing budget")
    public ResponseEntity<BudgetResponseDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody BudgetRequestDTO request) {
        log.info("[ADMIN] Modification du budget ID: {}.", id);
        BudgetResponseDTO response = budgetService.updateBudget(id, request);
        log.info("✅ Budget ID: {} mis à jour avec succès.", id);
        return ResponseEntity.ok(response);
    }
}