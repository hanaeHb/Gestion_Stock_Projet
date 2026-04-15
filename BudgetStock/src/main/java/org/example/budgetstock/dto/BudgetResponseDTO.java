package org.example.budgetstock.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor @AllArgsConstructor
@Builder
public class BudgetResponseDTO {
    private Long idBudget;
    private String description;
    private BigDecimal montantInitial;
    private BigDecimal montantConsomme;
    private BigDecimal montantRestant;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private String status;
    private boolean isExhausted;

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

    public boolean isExhausted() {
        return isExhausted;
    }

    public void setExhausted(boolean exhausted) {
        isExhausted = exhausted;
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

    public BigDecimal getMontantRestant() {
        return montantRestant;
    }

    public void setMontantRestant(BigDecimal montantRestant) {
        this.montantRestant = montantRestant;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
