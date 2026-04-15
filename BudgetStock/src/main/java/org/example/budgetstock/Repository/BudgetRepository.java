package org.example.budgetstock.Repository;

import org.example.budgetstock.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {

    @Query("SELECT b FROM Budget b WHERE b.status = 'ACTIVE' AND :currentDate BETWEEN b.dateDebut AND b.dateFin")
    Optional<Budget> findActiveBudget(@Param("currentDate") LocalDate currentDate);
}
