package org.example.produitstock_service.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class MouvementStockResponseDTO {
    private Long idMouvement;
    private String type;
    private int quantite;
    private LocalDate dateMouvement;

    private Long produitId;
    private String produitNom;
    private String produitSku;
    private String referenceDocument;
    private String effectuePar;

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

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
