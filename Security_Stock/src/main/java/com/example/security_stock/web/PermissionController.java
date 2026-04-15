package com.example.security_stock.web;


import com.example.security_stock.entities.PermissionEntity;
import com.example.security_stock.service.PermissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Permissions", description = "API pour la gestion des permissions")
@RestController
@RequestMapping("/v1/permissions")
public class PermissionController {

    private final PermissionService permissionService;

    public PermissionController(PermissionService permissionService) {
        this.permissionService = permissionService;
    }

    @Operation(
            summary = "Créer une nouvelle permission",
            description = "Crée une permission avec un nom spécifique"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "201",
                    description = "Permission créée avec succès",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = PermissionEntity.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Nom de permission invalide ou déjà utilisé"
            )
    })
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<PermissionEntity> createPermission(
            @Parameter(
                    name = "name",
                    description = "Nom de la permission à créer",
                    required = true,
                    example = "CREATE_USERS"
            )
            @RequestParam String name) {
        PermissionEntity permission = permissionService.createPermission(name);
        return ResponseEntity.status(HttpStatus.CREATED).body(permission);
    }

    @Operation(
            summary = "Lister toutes les permissions",
            description = "Retourne la liste de toutes les permissions existantes"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Liste des permissions récupérée avec succès",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = PermissionEntity.class)
                    )
            )
    })
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<?> getAllPermissions() {
        return ResponseEntity.ok(permissionService.getAllPermissions());
    }

    @Operation(
            summary = "Supprimer une permission",
            description = "Supprime une permission par son ID. Note: Impossible de supprimer une permission utilisée par des rôles."
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Permission supprimée avec succès",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = String.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Permission non trouvée"
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "Conflit - Permission utilisée par des rôles"
            )
    })
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePermission(
            @Parameter(
                    name = "id",
                    description = "ID de la permission à supprimer",
                    required = true,
                    example = "1"
            )
            @PathVariable Integer id) {

        try {
            permissionService.deletePermission(id);
            return ResponseEntity.ok("Permission supprimée avec succès");

        } catch (RuntimeException e) {
            // Gérer les erreurs spécifiques
            if (e.getMessage().contains("non trouvée")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(e.getMessage());
            } else if (e.getMessage().contains("Impossible de supprimer") ||
                    e.getMessage().contains("assignée") ||
                    e.getMessage().contains("utilisée")) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(e.getMessage());
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Erreur: " + e.getMessage());
            }
        }
    }
}
