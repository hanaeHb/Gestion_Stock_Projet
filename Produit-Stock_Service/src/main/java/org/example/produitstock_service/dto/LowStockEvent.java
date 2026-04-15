package org.example.produitstock_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
public class LowStockEvent {
    private Long id;
    private String nom;
    private Integer quantiteActuelle;
    private Integer seuil;

    public LowStockEvent(String nom, Long id, Integer quantiteActuelle, Integer seuil) {
        this.id = id;
        this.nom = nom;
        this.quantiteActuelle = quantiteActuelle;
        this.seuil = seuil;
    }

    public LowStockEvent() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public Integer getQuantiteActuelle() {
        return quantiteActuelle;
    }

    public void setQuantiteActuelle(Integer quantiteActuelle) {
        this.quantiteActuelle = quantiteActuelle;
    }

    public Integer getSeuil() {
        return seuil;
    }

    public void setSeuil(Integer seuil) {
        this.seuil = seuil;
    }
}
