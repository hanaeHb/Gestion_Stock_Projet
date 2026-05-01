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
import org.springframework.scheduling.annotation.Scheduled;
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
        LocalDate today = LocalDate.now();

        if (budget.getDateDebut().isAfter(today)) {
            budget.setStatus(BudgetStatus.PLANNED);
        }
        else if (budget.getDateFin().isBefore(today)) {
            budget.setStatus(BudgetStatus.CLOSED);
        }
        else {
            budget.setStatus(BudgetStatus.ACTIVE);
        }

        if (budget.getMontantConsomme() == null) {
            budget.setMontantConsomme(BigDecimal.ZERO);
        }

        Budget savedBudget = budgetRepository.save(budget);
        return budgetMapper.toResponse(savedBudget);
    }
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void updateStatusDynamically() {
        LocalDate today = LocalDate.now();
        List<Budget> budgets = budgetRepository.findAll();

        for (Budget b : budgets) {
            if (b.getStatus() == BudgetStatus.PLANNED && !b.getDateDebut().isAfter(today)) {
                b.setStatus(BudgetStatus.ACTIVE);
            }
            if (b.getStatus() != BudgetStatus.CLOSED && b.getDateFin().isBefore(today)) {
                b.setStatus(BudgetStatus.CLOSED);
            }
        }
        budgetRepository.saveAll(budgets);
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
    @Transactional
    public boolean checkAndConsumeBudget(BigDecimal montantAction) {
        Budget budget = budgetRepository.findActiveBudget(LocalDate.now())
                .orElseThrow(() -> new RuntimeException("No active budget found to process this purchase"));

        BigDecimal remaining = budget.getMontantRestant();

        if (remaining.compareTo(montantAction) >= 0) {
            budget.setMontantConsomme(budget.getMontantConsomme().add(montantAction));

            if (budget.getMontantRestant().compareTo(BigDecimal.ZERO) <= 0) {
                budget.setStatus(BudgetStatus.EXHAUSTED);
            }

            budgetRepository.save(budget);
            return true;
        }

        return false;
    }
    @Override
    public void deleteBudget(Long id) {
        if (!budgetRepository.existsById(id)) {
            throw new RuntimeException("Budget not found");
        }
        budgetRepository.deleteById(id);
    }
    @Override
    public BudgetResponseDTO updateBudget(Long id, BudgetRequestDTO request) {
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Budget not found with id: " + id));

        budget.setDescription(request.getDescription());
        budget.setMontantInitial(request.getMontantInitial());
        budget.setDateDebut(request.getDateDebut());
        budget.setDateFin(request.getDateFin());

        LocalDate today = LocalDate.now();
        if (budget.getDateDebut().isAfter(today)) {
            budget.setStatus(BudgetStatus.PLANNED);
        } else if (budget.getDateFin().isBefore(today)) {
            budget.setStatus(BudgetStatus.CLOSED);
        } else if (budget.getMontantRestant().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            budget.setStatus(BudgetStatus.EXHAUSTED);
        } else {
            budget.setStatus(BudgetStatus.ACTIVE);
        }

        Budget updatedBudget = budgetRepository.save(budget);
        return budgetMapper.toResponse(updatedBudget);
    }
}
