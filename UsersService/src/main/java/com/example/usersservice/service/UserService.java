package com.example.usersservice.service;

import com.example.usersservice.DTO.UserRequest;
import com.example.usersservice.DTO.UserResponce;
import com.example.usersservice.entities.MetierRole;
import com.example.usersservice.entities.ProfileStatus;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;

public interface UserService {
    // Créer un profil interne pour un userId donné
    UserResponce createUserProfile(Integer userId, String nom,
                                   String prenom, String email, String phone, String cin, UserRequest request);
    // Mettre à jour le profil interne existant
    UserResponce updateUserProfile(Integer userId, UserRequest request);
    // Récupérer un profil interne par userId
    UserResponce getUserProfileById(Integer userId);
    // Récupérer la liste de tous les profils internes
    List<UserResponce> getAllUserProfiles(Jwt jwt);
    // Supprimer un profil interne par userId
    void deleteUserProfile(Integer userId);
    // Changer le status du profil (ex: DRAFT → PENDING → VALIDATED → REJECTED)
    UserResponce changeProfileStatus(Integer userId, String status, Integer adminId, String rejectionReason);
    public void updateMetierRole(Integer userId, MetierRole role);

    public void updateProfileStatus(Integer userId, ProfileStatus status);
}
