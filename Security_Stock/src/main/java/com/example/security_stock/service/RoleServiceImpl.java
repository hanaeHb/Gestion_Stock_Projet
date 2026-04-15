package com.example.security_stock.service;


import com.example.security_stock.entities.PermissionEntity;
import com.example.security_stock.entities.Role;
import com.example.security_stock.repository.PermissionEntityRepository;
import com.example.security_stock.repository.RoleRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Transactional

public class RoleServiceImpl implements RoleService {

    private final RoleRepository roleRepository;
    private final PermissionEntityRepository permissionRepository;

    public RoleServiceImpl(RoleRepository roleRepository,
                           PermissionEntityRepository permissionRepository) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
    }

    @Override
    public Role createRole(String roleName) {
        Role role = new Role();
        role.setName(roleName);
        return roleRepository.save(role);
    }

    @Override
    public void assignPermissionToRole(String roleName, String permissionName) {

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        PermissionEntity permission = permissionRepository.findByName(permissionName)
                .orElseThrow(() -> new RuntimeException("Permission not found"));

        role.getPermissions().add(permission);
        roleRepository.save(role);
    }

    @Override
    public void removePermissionFromRole(String roleName, String permissionName) {

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        PermissionEntity permission = permissionRepository.findByName(permissionName)
                .orElseThrow(() -> new RuntimeException("Permission not found"));

        role.getPermissions().remove(permission);
        roleRepository.save(role);
    }

    @Override
    public void deleteRoleByName(String roleName) {

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        role.getPermissions().clear();
        roleRepository.delete(role);
    }

    @Override
    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }
}
