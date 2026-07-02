package com.example.usersservice.service.impl;

import com.example.usersservice.DTO.UserRequest;
import com.example.usersservice.DTO.UserResponce;
import com.example.usersservice.entities.MetierRole;
import com.example.usersservice.entities.ProfileStatus;
import com.example.usersservice.entities.Users;
import com.example.usersservice.mapper.UserMapper;
import com.example.usersservice.repository.UserRepository;
import com.example.usersservice.service.UserService;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository repository;
    private final UserMapper mapper;

    public UserServiceImpl(UserRepository repository, UserMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public UserResponce createUserProfile(Integer userId, String nom,
                                          String prenom, String email, String phone, String cin, UserRequest request) {
        if (repository.existsByUserId(userId)) {
            throw new RuntimeException("Le profil interne existe déjà pour ce userId.");
        }

        Users profile = mapper.RequesttoEntity(request, userId);
        profile.setNom(nom);
        profile.setPrenom(prenom);
        profile.setEmail(email);
        profile.setPhone(phone);
        profile.setCin(cin);
        profile.setCreatedAt(LocalDateTime.now());
        if(profile.getMetierRole() == null ) {
            profile.setMetierRole(MetierRole.DEFAULT);
        }
        repository.save(profile);
        return mapper.EntitytoResponse(profile);
    }

    @Override
    public UserResponce updateUserProfile(Integer userId, UserRequest request) {
        Users profile = repository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Profil interne non trouvé."));

        if(request.getPhone() != null) profile.setPhone(request.getPhone());
        if(request.getCin() != null) profile.setCin(request.getCin());
        if(request.getImage() != null) profile.setImage(request.getImage());

        profile.setUpdatedAt(LocalDateTime.now());
        repository.save(profile);

        return mapper.EntitytoResponse(profile);
    }

    @Override
    public void updateMetierRole(Integer userId, MetierRole role) {
        Users profile = repository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Profil non trouvé"));

        profile.setMetierRole(role);
        profile.setUpdatedAt(LocalDateTime.now());
        repository.save(profile);
    }


    @Override
    public UserResponce getUserProfileById(Integer userId) {
        Users profile = repository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Profil interne non trouvé."));
        return mapper.EntitytoResponse(profile);
    }

    @Override
    public List<UserResponce> getAllUserProfiles(Jwt jwt) {

        List<String> roles = jwt.getClaim("roles");

        boolean isAdmin = roles.contains("ADMIN");
        boolean isManager = roles.contains("MANAGER");

        // ADMIN
        if (isAdmin) {
            return repository.findAll()
                    .stream()
                    .map(mapper::EntitytoResponse)
                    .collect(Collectors.toList());
        }

        return List.of();
    }


    @Override
    public void updateProfileStatus(Integer userId, ProfileStatus status) {
        Users profile = repository.findByUserId(userId);
        if(profile == null){
            throw new RuntimeException("Profil introuvable");
        }
        profile.setStatus(status);
        repository.save(profile);
    }

    @Override
    public void deleteUserProfile(Integer userId) {
        if (!repository.existsById(userId)) {
            throw new RuntimeException("Profil interne non trouvé.");
        }
        repository.deleteById(userId);
    }

    @Override
    public UserResponce changeProfileStatus(Integer userId, String status, Integer adminId, String rejectionReason) {
        Users profile = repository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Profil interne non trouvé."));

        ProfileStatus newStatus;
        try {
            newStatus = ProfileStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Status invalide. Utilisez DRAFT, PENDING, VALIDATED ou REJECTED.");
        }

        profile.setStatus(newStatus);

        if (newStatus == ProfileStatus.VALIDATED) {
            profile.setValidatedAt(LocalDateTime.now());
            profile.setValidatedBy(adminId);
        } else if (newStatus == ProfileStatus.REJECTED) {
            profile.setRejectionReason(rejectionReason);
            profile.setValidatedAt(LocalDateTime.now());
            profile.setValidatedBy(adminId);
        }

        profile.setUpdatedAt(LocalDateTime.now());
        repository.save(profile);

        return mapper.EntitytoResponse(profile);
    }
}
