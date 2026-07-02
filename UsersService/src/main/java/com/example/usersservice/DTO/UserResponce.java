package com.example.usersservice.DTO;

import com.example.usersservice.entities.MetierRole;
import com.example.usersservice.entities.ProfileStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class UserResponce {
    private Integer userId;
    private String nom;
    private String prenom;
    private String email;
    private String phone;
    private String cin;
    private String image;
    private MetierRole metierRole;
    private LocalDate dateEmbauche;
    private LocalDate dernierConnex;
    private Integer superviseurId;
    private Boolean disponible;
    private ProfileStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime validatedAt;
    private Integer validatedBy;

    public UserResponce() {}

    public UserResponce(Integer userId, String nom, String prenom, String email,
                               String phone, String cin,
                               LocalDate dernierConnex, MetierRole metierRole, LocalDate dateEmbauche,
                               Integer superviseurId, Boolean disponible,
                               ProfileStatus status, LocalDateTime createdAt,
                               LocalDateTime updatedAt, LocalDateTime validatedAt,
                               Integer validatedBy, String image) {
        this.userId = userId;
        this.nom = nom;
        this.prenom = prenom;
        this.email = email;
        this.phone = phone;
        this.cin = cin;
        this.image = image;
        this.dernierConnex = dernierConnex;
        this.metierRole = metierRole;
        this.dateEmbauche = dateEmbauche;
        this.superviseurId = superviseurId;
        this.disponible = disponible;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.validatedAt = validatedAt;
        this.validatedBy = validatedBy;
    }


    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }




    public String getCin() { return cin; }
    public void setCin(String cin) { this.cin = cin; }


    public MetierRole getMetierRole() { return metierRole; }
    public void setMetierRole(MetierRole metierRole) { this.metierRole = metierRole; }

    public LocalDate getDernierConnex() {
        return dernierConnex;
    }

    public void setDernierConnex(LocalDate dernierConnex) {
        this.dernierConnex = dernierConnex;
    }

    public LocalDate getDateEmbauche() { return dateEmbauche; }
    public void setDateEmbauche(LocalDate dateEmbauche) { this.dateEmbauche = dateEmbauche; }

    public Integer getSuperviseurId() { return superviseurId; }
    public void setSuperviseurId(Integer superviseurId) { this.superviseurId = superviseurId; }

    public Boolean getDisponible() { return disponible; }
    public void setDisponible(Boolean disponible) { this.disponible = disponible; }

    public ProfileStatus getStatus() { return status; }
    public void setStatus(ProfileStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getValidatedAt() { return validatedAt; }
    public void setValidatedAt(LocalDateTime validatedAt) { this.validatedAt = validatedAt; }

    public Integer getValidatedBy() { return validatedBy; }
    public void setValidatedBy(Integer validatedBy) { this.validatedBy = validatedBy; }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }
}
