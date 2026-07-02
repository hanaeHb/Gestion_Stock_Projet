package com.example.usersservice.DTO;

import com.example.usersservice.entities.MetierRole;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class UserRequest {

    //@Pattern(regexp = "^(\\+212|0)[5-7][0-9]{8}$")
    private String phone;

    private String email;
    private LocalDate dateNaissance;
    private String cin;
    private String image;
    @NotNull
    private MetierRole metierRole;


    private LocalDate dateEmbauche;
    private Integer superviseurId;

    public UserRequest() {}

    public UserRequest(String phone, String email,
                              LocalDate dateNaissance, String cin,
                              MetierRole metierRole,
                              LocalDate dateEmbauche, Integer superviseurId, String image) {
        this.phone = phone;
        this.email = email;
        this.image = image;
        this.dateNaissance = dateNaissance;
        this.cin = cin;
        this.metierRole = metierRole;
        this.dateEmbauche = dateEmbauche;
        this.superviseurId = superviseurId;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }


    public LocalDate getDateNaissance() { return dateNaissance; }
    public void setDateNaissance(LocalDate dateNaissance) { this.dateNaissance = dateNaissance; }

    public String getCin() { return cin; }
    public void setCin(String cin) { this.cin = cin; }

    public MetierRole getMetierRole() { return metierRole; }
    public void setMetierRole(MetierRole metierRole) { this.metierRole = metierRole; }

    public LocalDate getDateEmbauche() { return dateEmbauche; }
    public void setDateEmbauche(LocalDate dateEmbauche) { this.dateEmbauche = dateEmbauche; }

    public Integer getSuperviseurId() { return superviseurId; }
    public void setSuperviseurId(Integer superviseurId) { this.superviseurId = superviseurId; }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }
}
