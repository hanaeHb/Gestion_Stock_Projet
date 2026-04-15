package org.example.budgetstock.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import jakarta.validation.constraints.*;
import lombok.*;

@Data
public class BudgetRequestDTO {
    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Initial amount is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Amount must be greater than 0")
    private BigDecimal montantInitial;

    @NotNull(message = "Start date is required")
    private LocalDate dateDebut;

    @NotNull(message = "End date is required")
    private LocalDate dateFin;

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

    public BigDecimal getMontantInitial() {
        return montantInitial;
    }

    public void setMontantInitial(BigDecimal montantInitial) {
        this.montantInitial = montantInitial;
    }
}
