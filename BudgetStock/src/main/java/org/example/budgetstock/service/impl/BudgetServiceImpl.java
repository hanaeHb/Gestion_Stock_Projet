package org.example.budgetstock.service.impl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.example.budgetstock.Repository.BudgetRepository;
import org.example.budgetstock.dto.BudgetRequestDTO;
import org.example.budgetstock.dto.BudgetResponseDTO;
import org.example.budgetstock.entity.Budget;
import org.example.budgetstock.entity.BudgetStatus;
import org.example.budgetstock.mapper.BudgetMapper;
import org.example.budgetstock.service.IBudgetService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class BudgetServiceImpl implements IBudgetService {

    private final BudgetRepository budgetRepository;
    private final BudgetMapper budgetMapper;

    @Override
    public BudgetResponseDTO createBudget(BudgetRequestDTO request) {
        Budget budget = budgetMapper.fromRequest(request);
        Budget savedBudget = budgetRepository.save(budget);
        return budgetMapper.toResponse(savedBudget);
    }

    @Override
    public BudgetResponseDTO getActiveBudget() {
        Budget budget = budgetRepository.findActiveBudget(LocalDate.now())
                .orElseThrow(() -> new RuntimeException("No active budget found for today"));
        return budgetMapper.toResponse(budget);
    }

    @Override
    public List<BudgetResponseDTO> getAllBudgets() {
        return budgetRepository.findAll().stream()
                .map(budgetMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public boolean checkAndConsumeBudget(BigDecimal montantAction) {
        Budget budget = budgetRepository.findActiveBudget(LocalDate.now())
                .orElseThrow(() -> new RuntimeException("No active budget found to process this purchase"));

        if (budget.getMontantRestant().compareTo(montantAction) >= 0) {
            budget.setMontantConsomme(budget.getMontantConsomme().add(montantAction));

            if (budget.getMontantRestant().compareTo(BigDecimal.ZERO) == 0) {
                budget.setStatus(BudgetStatus.EXHAUSTED);
            }

            budgetRepository.save(budget);
            return true;
        }

        return false;
    }
}
