package org.example.budgetstock.web;


import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.budgetstock.dto.BudgetRequestDTO;
import org.example.budgetstock.dto.BudgetResponseDTO;
import org.example.budgetstock.service.IBudgetService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/v1/budgets")
@RequiredArgsConstructor
@Tag(name = "Budget Management", description = "Endpoints for managing and checking purchasing budgets")
public class BudgetController {

    private final IBudgetService budgetService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new budget period")
    public ResponseEntity<BudgetResponseDTO> create(@Valid @RequestBody BudgetRequestDTO request) {
        return new ResponseEntity<>(budgetService.createBudget(request), HttpStatus.CREATED);
    }

    @GetMapping("/current")
    @PreAuthorize("hasAnyRole('ADMIN','Procurement Manager')")
    @Operation(summary = "Get the active budget for the current date")
    public ResponseEntity<BudgetResponseDTO> getCurrent() {
        return ResponseEntity.ok(budgetService.getActiveBudget());
    }

    @GetMapping
    @Operation(summary = "Get all budget history")
    public ResponseEntity<List<BudgetResponseDTO>> getAll() {
        return ResponseEntity.ok(budgetService.getAllBudgets());
    }

    @PostMapping("/check-consume")
    @Operation(summary = "Check if budget is sufficient and consume it")
    public ResponseEntity<String> consume(@RequestBody BigDecimal amount) {
        boolean success = budgetService.checkAndConsumeBudget(amount);
        if (success) {
            return ResponseEntity.ok("Budget consumed successfully");
        } else {
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED)
                    .body("Insufficient budget for this operation");
        }
    }
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        budgetService.deleteBudget(id);
        return ResponseEntity.noContent().build();
    }
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update an existing budget")
    public ResponseEntity<BudgetResponseDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody BudgetRequestDTO request) {
        return ResponseEntity.ok(budgetService.updateBudget(id, request));
    }
}