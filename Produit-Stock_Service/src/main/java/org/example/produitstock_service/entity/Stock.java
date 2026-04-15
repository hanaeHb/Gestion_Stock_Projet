package org.example.produitstock_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Stock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idStock;

    private int quantiteDisponible;
    private int seuilCritique;
    private String emplacement;
    private LocalDate dateDerniereMiseAJour;

    @OneToOne
    @JoinColumn(name = "produit_id")
    private Produit produit;

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

    public Produit getProduit() {
        return produit;
    }

    public void setProduit(Produit produit) {
        this.produit = produit;
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