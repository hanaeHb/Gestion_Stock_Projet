package com.example.usersservice.mapper;

import com.example.usersservice.DTO.UserRequest;
import com.example.usersservice.DTO.UserResponce;
import com.example.usersservice.entities.ProfileStatus;
import com.example.usersservice.entities.Users;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    // Mapper de Request DTO vers Entity
    public Users RequesttoEntity(UserRequest request, Integer userId) {
        Users profile = new Users();
        profile.setUserId(userId);
        //profile.setNom(request.getNom());
        // profile.setPrenom(request.getPrenom());
        profile.setPhone(request.getPhone());
        profile.setImage(request.getImage());
        profile.setEmail(request.getEmail());
        profile.setCin(request.getCin());
        profile.setMetierRole(request.getMetierRole());
        profile.setDateEmbauche(request.getDateEmbauche());
        profile.setSuperviseurId(request.getSuperviseurId());
        profile.setDisponible(true);
        profile.setStatus(ProfileStatus.DRAFT);
        profile.setCreatedAt(java.time.LocalDateTime.now());
        return profile;
    }

    // Mapper de Entity vers Response DTO
    public UserResponce EntitytoResponse(Users profile) {
        UserResponce response = new UserResponce();
        response.setUserId(profile.getUserId());
        response.setNom(profile.getNom());
        response.setPrenom(profile.getPrenom());
        response.setEmail(profile.getEmail());
        response.setPhone(profile.getPhone());
        response.setCin(profile.getCin());
        response.setImage(profile.getImage());
        response.setDernierConnex(profile.getDernierConnex());
        response.setMetierRole(profile.getMetierRole());
        response.setDateEmbauche(profile.getDateEmbauche());
        response.setSuperviseurId(profile.getSuperviseurId());
        response.setDisponible(profile.getDisponible());
        response.setStatus(profile.getStatus());
        response.setCreatedAt(profile.getCreatedAt());
        response.setUpdatedAt(profile.getUpdatedAt());
        response.setValidatedAt(profile.getValidatedAt());
        response.setValidatedBy(profile.getValidatedBy());
        return response;
    }

}
