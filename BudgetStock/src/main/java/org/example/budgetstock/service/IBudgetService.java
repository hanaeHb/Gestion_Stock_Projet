package org.example.budgetstock.service;

import org.example.budgetstock.dto.BudgetRequestDTO;
import org.example.budgetstock.dto.BudgetResponseDTO;

import java.math.BigDecimal;
import java.util.List;

public interface IBudgetService {
    BudgetResponseDTO createBudget(BudgetRequestDTO request);
    BudgetResponseDTO getActiveBudget();
    List<BudgetResponseDTO> getAllBudgets();

    boolean checkAndConsumeBudget(BigDecimal montantAction);
}
