package com.example.security_stock.repository;

import com.example.security_stock.entities.PermissionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PermissionEntityRepository extends JpaRepository<PermissionEntity, Integer> {
    Optional<PermissionEntity> findByName(String permissionname);
    boolean existsByName(String name);

}
