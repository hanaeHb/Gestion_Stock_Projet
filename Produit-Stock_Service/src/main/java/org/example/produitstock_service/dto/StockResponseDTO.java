package org.example.produitstock_service.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class StockResponseDTO {
    private Long idStock;
    private int quantiteDisponible;
    private int seuilCritique;
    private String emplacement;
    private LocalDate dateDerniereMiseAJour;
    private Long produitId;
    private String produitNom;
    private String produitSku;

    public LocalDate getDateDerniereMiseAJour() {
        return dateDerniereMiseAJour;
    }

    public void setDateDerniereMiseAJour(LocalDate dateDerniereMiseAJour) {
        this.dateDerniereMiseAJour = dateDerniereMiseAJour;
    }

    public String getEmplacement() {
        return emplacement;
    }

    public void setEmplacement(String emplacement) {
        this.emplacement = emplacement;
    }

    public Long getIdStock() {
        return idStock;
    }

    public void setIdStock(Long idStock) {
        this.idStock = idStock;
    }

    public Long getProduitId() {
        return produitId;
    }

    public void setProduitId(Long produitId) {
        this.produitId = produitId;
    }

    public String getProduitNom() {
        return produitNom;
    }

    public void setProduitNom(String produitNom) {
        this.produitNom = produitNom;
    }

    public String getProduitSku() {
        return produitSku;
    }

    public void setProduitSku(String produitSku) {
        this.produitSku = produitSku;
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
