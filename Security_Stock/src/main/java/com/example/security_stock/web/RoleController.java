package com.example.security_stock.web;


import com.example.security_stock.entities.Role;
import com.example.security_stock.service.RoleService;
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

import java.util.List;

@Tag(name = "Roles", description = "API pour la gestion des rôles et permissions")
@RestController
@RequestMapping("/v1/roles")
public class RoleController {

    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    // ================= CREATE ROLE =================
    @Operation(summary = "Créer un nouveau rôle", description = "Crée un rôle avec un nom spécifique")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Rôle créé avec succès",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = Role.class))),
            @ApiResponse(responseCode = "400", description = "Nom du rôle invalide ou déjà utilisé")
    })
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Role> createRole(
            @Parameter(description = "Nom du rôle", required = true, example = "ADMIN")
            @RequestParam String name) {
        Role role = roleService.createRole(name);
        return ResponseEntity.status(HttpStatus.CREATED).body(role);
    }

    // ================= GET ALL ROLES =================
    @Operation(summary = "Afficher la liste des rôles", description = "Retourne tous les rôles existants")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Liste des rôles récupérée avec succès",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = Role.class)))
    })
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<Role>> getAllRoles() {
        return ResponseEntity.ok(roleService.getAllRoles());
    }

    // ================= ASSIGN PERMISSION =================
    @Operation(summary = "Assigner une permission à un rôle", description = "Attribue une permission existante à un rôle")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Permission assignée avec succès"),
            @ApiResponse(responseCode = "404", description = "Rôle ou permission non trouvé")
    })
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{roleName}/permissions")
    public ResponseEntity<String> assignPermissionToRole(
            @PathVariable String roleName,
            @RequestParam String permissionName) {

        roleService.assignPermissionToRole(roleName, permissionName);
        return ResponseEntity.ok("Permission assignée avec succès");
    }

    // ================= REMOVE PERMISSION =================
    @Operation(summary = "Supprimer une permission d’un rôle", description = "Supprime une permission spécifique d’un rôle")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Permission supprimée avec succès"),
            @ApiResponse(responseCode = "404", description = "Rôle ou permission non trouvé")
    })
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{roleName}/permissions/{permissionName}")
    public ResponseEntity<String> removePermissionFromRole(
            @PathVariable String roleName,
            @PathVariable String permissionName) {

        roleService.removePermissionFromRole(roleName, permissionName);
        return ResponseEntity.ok("Permission supprimée avec succès");
    }

    // ================= DELETE ROLE =================
    @Operation(summary = "Supprimer un rôle", description = "Supprime un rôle et ses relations")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Rôle supprimé avec succès"),
            @ApiResponse(responseCode = "404", description = "Rôle non trouvé")
    })
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{roleName}")
    public ResponseEntity<String> deleteRole(
            @PathVariable String roleName) {

        roleService.deleteRoleByName(roleName);
        return ResponseEntity.ok("Rôle supprimé avec succès");
    }
}

