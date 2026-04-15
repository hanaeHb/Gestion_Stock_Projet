package com.example.security_stock.service;


import com.example.security_stock.entities.PermissionEntity;

import java.util.List;

public interface PermissionService {
    PermissionEntity createPermission(String permissionName);

    List<PermissionEntity> getAllPermissions();
    void deletePermission(Integer id);
}

