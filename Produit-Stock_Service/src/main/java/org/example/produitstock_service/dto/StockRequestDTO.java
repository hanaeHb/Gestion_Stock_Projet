package org.example.produitstock_service.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class StockRequestDTO {
    private int quantiteDisponible;
    private int seuilCritique;
    private String emplacement;
    private Long produitId;

    public String getEmplacement() {
        return emplacement;
    }

    public void setEmplacement(String emplacement) {
        this.emplacement = emplacement;
    }

    public Long getProduitId() {
        return produitId;
    }

    public void setProduitId(Long produitId) {
        this.produitId = produitId;
    }

    public int getQuantiteDisponible() {
        return quantiteDisponible;
    }

    public void setQuantiteDisponible(int quantiteDisponible) {
        this.quantiteDisponible = quantiteDisponible;
    }

    public int getSeuilCritique() {
        return seuilCritique;
    }

    public void setSeuilCritique(int seuilCritique) {
        this.seuilCritique = seuilCritique;
    }
}
