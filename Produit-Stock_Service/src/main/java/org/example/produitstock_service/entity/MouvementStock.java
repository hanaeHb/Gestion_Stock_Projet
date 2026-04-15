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
public class MouvementStock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idMouvement;

    @Enumerated(EnumType.STRING)
    private TypeMouvement type;

    private int quantite;
    private LocalDate dateMouvement;

    private String referenceDocument;
    private String effectuePar;

    @ManyToOne
    @JoinColumn(name = "produit_id")
    private Produit produit;

    public LocalDate getDateMouvement() {
        return dateMouvement;
    }

    public void setDateMouvement(LocalDate dateMouvement) {
        this.dateMouvement = dateMouvement;
    }

    public String getEffectuePar() {
        return effectuePar;
    }

    public void setEffectuePar(String effectuePar) {
        this.effectuePar = effectuePar;
    }

    public Long getIdMouvement() {
        return idMouvement;
    }

    public void setIdMouvement(Long idMouvement) {
        this.idMouvement = idMouvement;
    }

    public Produit getProduit() {
        return produit;
    }

    public void setProduit(Produit produit) {
        this.produit = produit;
    }

    public int getQuantite() {
        return quantite;
    }

    public void setQuantite(int quantite) {
        this.quantite = quantite;
    }

    public String getReferenceDocument() {
        return referenceDocument;
    }

    public void setReferenceDocument(String referenceDocument) {
        this.referenceDocument = referenceDocument;
    }

    public TypeMouvement getType() {
        return type;
    }

    public void setType(TypeMouvement type) {
        this.type = type;
    }
}