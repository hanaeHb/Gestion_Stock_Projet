package com.example.usersservice.web;

import com.example.usersservice.DTO.UserRequest;
import com.example.usersservice.DTO.UserResponce;
import com.example.usersservice.entities.MetierRole;
import com.example.usersservice.entities.ProfileStatus;
import com.example.usersservice.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.security.PermitAll;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "User Profiles", description = "API pour la gestion des profils internes")
@RestController
@Slf4j
@RequestMapping("/v1/user-profiles")
public class UserController {

    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @Operation(
            summary = "Créer un nouveau profil interne (Admin ou user profil)",
            description = "Crée un profil pour l'utilisateur interne connecté (userId extrait du token)"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Profil créé avec succès"),
            @ApiResponse(responseCode = "409", description = "Le profil existe déjà")
    })
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<UserResponce> createUserProfile(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UserRequest request,
            @RequestParam(required = false) Integer userIdParam) {

        String adminEmail = jwt.getClaim("email");
        log.info("[ADMIN: {}] Tentative de création d'un profil interne.", adminEmail);

        Integer userId;
        List<String> roles = jwt.getClaim("roles");
        if (userIdParam != null) {
            if (!roles.contains("ADMIN")) {
                log.warn("⚠️ Accès refusé : L'utilisateur {} a tenté de forcer un 'userIdParam' sans droits ADMIN !", adminEmail);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            userId = userIdParam;
            log.info("[ADMIN] Création forcée du profil pour l'utilisateur ID: {}", userId);
        } else {
            userId = ((Long) jwt.getClaim("userId")).intValue();

        }
        String nom = jwt.getClaim("nom");
        String prenom = jwt.getClaim("prenom");
        String email = jwt.getClaim("email");
        String phone = jwt.getClaim("phone");
        String cin = jwt.getClaim("cin");
        UserResponce response = service.createUserProfile(userId, nom, prenom, email, phone, cin, request);
        log.info("✅ Profil interne créé avec succès pour ID: {} (Email: {})", userId, email);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Mettre à jour un profil interne existant (Admin ou user profil)",
            description = "Met à jour les informations personnelles et métier du profil interne")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Profil mis à jour avec succès"),
            @ApiResponse(responseCode = "404", description = "Profil non trouvé")
    })

    @PreAuthorize(
            "authentication.principal.claims['roles'].contains('ADMIN') or " +
                    "authentication.principal.claims['roles'].contains('Manager') or " +
                    "authentication.principal.claims['roles'].contains(' PROCUREMENT_MANAGER') or " +
                    "authentication.principal.claims['roles'].contains('InventoryManager')"
    )
    @PutMapping("/me")
    public ResponseEntity<UserResponce> updateMyProfilePartial(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody UserRequest request) {

        Integer userId = ((Long) jwt.getClaim("userId")).intValue();

        return ResponseEntity.ok(service.updateUserProfile(userId, request));
    }

    @Operation(summary = "Obtenir mon profil interne (user profil)",
            description = "Retourne le profil complet de l'utilisateur connecté")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Profil récupéré avec succès"),
            @ApiResponse(responseCode = "404", description = "Profil non trouvé")
    })

    @PreAuthorize(
            "authentication.principal.claims['roles'].contains('ADMIN') or " +
                    "authentication.principal.claims['roles'].contains('Manager') or " +
                    "authentication.principal.claims['roles'].contains('PROCUREMENT_MANAGER') or " +
                    "authentication.principal.claims['roles'].contains('InventoryManager')"
    )
    @GetMapping("/me")
    public ResponseEntity<UserResponce> getMyProfile(@AuthenticationPrincipal Jwt jwt) {

        Integer userId = ((Long) jwt.getClaim("userId")).intValue();
        String email = jwt.getClaim("email");
        log.info("[Profile Pipeline] Récupération du profil interne pour l'utilisateur ID: {} ({})", userId, email);
        String nom = jwt.getClaim("nom");
        String prenom = jwt.getClaim("prenom");
        String phone = jwt.getClaim("phone");
        String cin = jwt.getClaim("cin");

        List<String> roles = jwt.getClaim("roles");

        String mainRole = roles.get(0);
        MetierRole jwtRole;
        try {
            jwtRole = MetierRole.valueOf(mainRole.toUpperCase().replace(" ", "_"));
        } catch (IllegalArgumentException e) {

            jwtRole = MetierRole.DEFAULT;
        }

        UserResponce profile;

        try {
            profile = service.getUserProfileById(userId);
            if (profile.getMetierRole() != jwtRole) {
                log.info("🔄 Désynchronisation détectée : Mise à jour du rôle métier pour ID {} -> {}", userId, jwtRole);
                service.updateMetierRole(userId, jwtRole);
                profile.setMetierRole(jwtRole);
            }

        } catch (RuntimeException e) {
            log.warn("⚠️ Profil introuvable pour l'ID: {} en base. Déclenchement automatique de la création du profil (Fallback).", userId);
            UserRequest request = new UserRequest();
            request.setMetierRole(jwtRole);

            profile = service.createUserProfile(
                    userId,
                    nom != null ? nom : "Inconnu",
                    prenom != null ? prenom : "Inconnu",
                    email,
                    phone,
                    cin,
                    request
            );
            log.info("✅ Profil auto-créé avec succès pour l'utilisateur ID: {}", userId);
        }

        return ResponseEntity.ok(profile);
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(@AuthenticationPrincipal Jwt jwt) {
        Integer userId = ((Long) jwt.getClaim("userId")).intValue();
        String email = jwt.getClaim("email");
        log.info("🚪 [Session] Déconnexion demandée pour l'utilisateur ID: {} ({})", userId, email);
        service.updateProfileStatus(userId, ProfileStatus.OUT_WORK);
        log.info("✅ [Session] Statut de l'utilisateur ID {} mis à jour vers: OUT_WORK", userId);
        return ResponseEntity.ok("Utilisateur déconnecté, status OUT_WORK");
    }

    @Operation(summary = "Lister tous les profils internes(Admin)",
            description = "Retourne la liste complète des profils internes existants")
    @ApiResponse(responseCode = "200", description = "Liste des profils récupérée avec succès")

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<UserResponce>> getAllUserProfiles(
            @AuthenticationPrincipal Jwt jwt
    ) {
        return ResponseEntity.ok(service.getAllUserProfiles(jwt));
    }

    @Operation(summary = "Supprimer profil interne (Admin)",
            description = "Supprime le profil de l'utilisateur connecté")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Profil supprimé avec succès"),
            @ApiResponse(responseCode = "404", description = "Profil non trouvé")
    })
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping
    public ResponseEntity<String> deleteMyProfile(@AuthenticationPrincipal Jwt jwt) {
        Integer userId = jwt.getClaim("userId");
        service.deleteUserProfile(userId);
        return ResponseEntity.ok("Profil interne supprimé avec succès.");
    }

    @Operation(summary = "Changer le statut d'un profil interne (Admin)",
            description = "Permet à un admin de valider ou rejeter un profil interne")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Statut du profil mis à jour"),
            @ApiResponse(responseCode = "400", description = "Status invalide"),
            @ApiResponse(responseCode = "404", description = "Profil non trouvé")
    })


    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{userId}/status")
    public ResponseEntity<UserResponce> changeProfileStatus(
            @PathVariable Integer userId,
            @Parameter(description = "Nouveau statut : DRAFT, PENDING, VALIDATED, REJECTED", required = true)
            @RequestParam String status,
            @Parameter(description = "ID de l'administrateur validant/rejetant le profil", required = true)
            @RequestParam Integer adminId,
            @Parameter(description = "Raison du rejet si applicable")
            @RequestParam(required = false) String rejectionReason) {

        return ResponseEntity.ok(service.changeProfileStatus(userId, status, adminId, rejectionReason));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{userId}")
    public ResponseEntity<String> deleteProfileByUserId(@PathVariable Integer userId) {
        log.warn("[ADMIN] Suppression définitive du profil interne de l'utilisateur ID: {}", userId);
        service.deleteUserProfile(userId);
        log.info("✅ Profil interne ID: {} supprimé avec succès.", userId);
        return ResponseEntity.ok("Profil supprimé");
    }

}


