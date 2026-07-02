package com.example.usersservice.entities;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
@Entity
@Table(name = "Users")
public class Users {
    @Id
    private Integer userId;

    private String nom;
    private String prenom;
    private String phone;
    private String email;
    private String cin;
    @Column(columnDefinition = "TEXT")
    private String image;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private MetierRole metierRole = MetierRole.DEFAULT;
    private LocalDate dernierConnex;
    private LocalDate dateEmbauche;
    private Integer superviseurId;
    private Boolean disponible = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ProfileStatus status = ProfileStatus.DRAFT;

    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime validatedAt;
    private Integer validatedBy;

    // ===== Constructors =====
    public Users() {}

    public Users(Integer userId, String nom, String prenom, String phone, String email,
                       String adresse, String cin, LocalDate dateNaissance,
                       MetierRole metierRole, String departement, LocalDate dateEmbauche,
                       Integer superviseurId, Boolean disponible, ProfileStatus status,
                       String rejectionReason, LocalDateTime createdAt, LocalDate dernierConnex,
                       LocalDateTime updatedAt, LocalDateTime validatedAt, Integer validatedBy, String image) {
        this.userId = userId;
        this.nom = nom;
        this.prenom = prenom;
        this.phone = phone;
        this.email = email;
        this.cin = cin;
        this.metierRole = metierRole;
        this.dateEmbauche = dateEmbauche;
        this.superviseurId = superviseurId;
        this.disponible = disponible;
        this.status = status;
        this.rejectionReason = rejectionReason;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.validatedAt = validatedAt;
        this.validatedBy = validatedBy;
        this.dernierConnex = dernierConnex;
        this.image = image;
    }

    // ===== Getters & Setters =====
    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }


    public String getCin() { return cin; }
    public void setCin(String cin) { this.cin = cin; }

    public MetierRole getMetierRole() { return metierRole; }
    public void setMetierRole(MetierRole metierRole) { this.metierRole = metierRole; }


    public LocalDate getDateEmbauche() { return dateEmbauche; }
    public void setDateEmbauche(LocalDate dateEmbauche) { this.dateEmbauche = dateEmbauche; }

    public Integer getSuperviseurId() { return superviseurId; }
    public void setSuperviseurId(Integer superviseurId) { this.superviseurId = superviseurId; }

    public Boolean getDisponible() { return disponible; }
    public void setDisponible(Boolean disponible) { this.disponible = disponible; }

    public ProfileStatus getStatus() { return status; }
    public void setStatus(ProfileStatus status) { this.status = status; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getValidatedAt() { return validatedAt; }
    public void setValidatedAt(LocalDateTime validatedAt) { this.validatedAt = validatedAt; }

    public Integer getValidatedBy() { return validatedBy; }
    public void setValidatedBy(Integer validatedBy) { this.validatedBy = validatedBy; }

    public LocalDate getDernierConnex() {
        return dernierConnex;
    }

    public void setDernierConnex(LocalDate dernierConnex) {
        this.dernierConnex = dernierConnex;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }
}
