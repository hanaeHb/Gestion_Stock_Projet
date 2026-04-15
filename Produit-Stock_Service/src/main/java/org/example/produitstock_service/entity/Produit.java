package org.example.produitstock_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Produit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String sku;

    private String nom;
    private String description;
    private double prixUnitaire;
    private String categorie;
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String image;

    private boolean active = true;

    @OneToOne(mappedBy = "produit", cascade = CascadeType.ALL)
    private Stock stock;

    @OneToMany(mappedBy = "produit", cascade = CascadeType.ALL)
    private List<MouvementStock> mouvements;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getCategorie() {
        return categorie;
    }

    public void setCategorie(String categorie) {
        this.categorie = categorie;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public List<MouvementStock> getMouvements() {
        return mouvements;
    }

    public void setMouvements(List<MouvementStock> mouvements) {
        this.mouvements = mouvements;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public double getPrixUnitaire() {
        return prixUnitaire;
    }

    public void setPrixUnitaire(double prixUnitaire) {
        this.prixUnitaire = prixUnitaire;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public Stock getStock() {
        return stock;
    }

    public void setStock(Stock stock) {
        this.stock = stock;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }
}