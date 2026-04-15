package org.example.budgetstock.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "budgets")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Budget {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idBudget;

    private String description;

    @Column(precision = 15, scale = 2)
    private BigDecimal montantInitial;

    @Column(precision = 15, scale = 2)
    private BigDecimal montantConsomme;

    private LocalDate dateDebut;
    private LocalDate dateFin;

    @Enumerated(EnumType.STRING)
    private BudgetStatus status;

    public LocalDate getDateDebut() {
        return dateDebut;
    }

    public void setDateDebut(LocalDate dateDebut) {
        this.dateDebut = dateDebut;
    }

    public LocalDate getDateFin() {
        return dateFin;
    }

    public void setDateFin(LocalDate dateFin) {
        this.dateFin = dateFin;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Long getIdBudget() {
        return idBudget;
    }

    public void setIdBudget(Long idBudget) {
        this.idBudget = idBudget;
    }

    public BigDecimal getMontantConsomme() {
        return montantConsomme;
    }

    public void setMontantConsomme(BigDecimal montantConsomme) {
        this.montantConsomme = montantConsomme;
    }

    public BigDecimal getMontantInitial() {
        return montantInitial;
    }

    public void setMontantInitial(BigDecimal montantInitial) {
        this.montantInitial = montantInitial;
    }

    public BudgetStatus getStatus() {
        return status;
    }

    public void setStatus(BudgetStatus status) {
        this.status = status;
    }

    public BigDecimal getMontantRestant() {
        if (montantInitial == null) return BigDecimal.ZERO;
        return montantInitial.subtract(montantConsomme != null ? montantConsomme : BigDecimal.ZERO);
    }
}
