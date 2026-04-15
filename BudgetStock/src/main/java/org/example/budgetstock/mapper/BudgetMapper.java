package org.example.budgetstock.mapper;

import org.example.budgetstock.dto.BudgetRequestDTO;
import org.example.budgetstock.dto.BudgetResponseDTO;
import org.example.budgetstock.entity.Budget;
import org.example.budgetstock.entity.BudgetStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class BudgetMapper {

    public Budget fromRequest(BudgetRequestDTO request) {
        if (request == null) return null;

        return Budget.builder()
                .description(request.getDescription())
                .montantInitial(request.getMontantInitial())
                .montantConsomme(BigDecimal.ZERO)
                .dateDebut(request.getDateDebut())
                .dateFin(request.getDateFin())
                .status(BudgetStatus.ACTIVE)
                .build();
    }

    public BudgetResponseDTO toResponse(Budget budget) {
        if (budget == null) return null;

        BigDecimal restant = budget.getMontantRestant();

        return BudgetResponseDTO.builder()
                .idBudget(budget.getIdBudget())
                .description(budget.getDescription())
                .montantInitial(budget.getMontantInitial())
                .montantConsomme(budget.getMontantConsomme())
                .montantRestant(restant)
                .dateDebut(budget.getDateDebut())
                .dateFin(budget.getDateFin())
                .status(budget.getStatus().toString())
                .isExhausted(restant.compareTo(BigDecimal.ZERO) <= 0)
                .build();
    }
}
