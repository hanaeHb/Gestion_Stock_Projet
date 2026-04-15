package com.example.security_stock.service;

import com.example.security_stock.entities.Role;

import java.util.List;

public interface RoleService {

    Role createRole(String roleName);

    void assignPermissionToRole(String roleName, String permissionName);

    void removePermissionFromRole(String roleName, String permissionName);

    void deleteRoleByName(String roleName);

    List<Role> getAllRoles();
}
