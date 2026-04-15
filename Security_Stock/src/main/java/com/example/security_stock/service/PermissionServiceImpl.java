package com.example.security_stock.service;


import com.example.security_stock.entities.PermissionEntity;
import com.example.security_stock.repository.PermissionEntityRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PermissionServiceImpl implements PermissionService {

    private final PermissionEntityRepository permissionRepository;

    public PermissionServiceImpl(PermissionEntityRepository permissionRepository) {
        this.permissionRepository = permissionRepository;
    }

    @Override
    public PermissionEntity createPermission(String permissionName) {
        if (permissionName == null || permissionName.trim().isEmpty()) {
            throw new IllegalArgumentException("Le nom de la permission ne peut pas être vide");
        }

        // Vérifier si la permission existe déjà
        if (permissionRepository.existsByName(permissionName)) {
            throw new RuntimeException("La permission '" + permissionName + "' existe déjà");
        }

        PermissionEntity permission = new PermissionEntity();
        permission.setName(permissionName.trim());

        return permissionRepository.save(permission);
    }

    @Override
    public List<PermissionEntity> getAllPermissions() {
        return permissionRepository.findAll();
    }





    @Override
    public void deletePermission(Integer id) {
        PermissionEntity permission = permissionRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Permission non trouvée avec l'ID : " + id)
                );

        // Vérifier si la permission est utilisée par des rôles
        if (permission.getRoles() != null && !permission.getRoles().isEmpty()) {
            throw new RuntimeException(
                    "Impossible de supprimer la permission '" + permission.getName() +
                            "' (ID: " + id + ") car elle est utilisée par " +
                            permission.getRoles().size() + " rôle(s). " +
                            "Noms des rôles: " +
                            permission.getRoles().stream()
                                    .map(role -> role.getName())
                                    .collect(Collectors.joining(", "))
            );
        }

        permissionRepository.delete(permission);
    }
}

