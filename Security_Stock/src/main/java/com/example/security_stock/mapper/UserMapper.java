package com.example.security_stock.mapper;


import com.example.security_stock.dto.UserRequestDTO;
import com.example.security_stock.dto.UserResponseDTO;
import com.example.security_stock.entities.PermissionEntity;
import com.example.security_stock.entities.Role;
import com.example.security_stock.entities.User;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Component
public class UserMapper {

    public User DTO_to_Entity(UserRequestDTO request) {
        User user = new User();

        user.setPassword(request.getPassword());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setCin(request.getCin());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setActive(true);
        user.setCreatedAt(LocalDateTime.now());

        return user;
    }

    public UserResponseDTO Entity_to_DTO(User user) {
        UserResponseDTO response = new UserResponseDTO();

        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setCin(user.getCin());
        response.setPhone(user.getPhone());
        response.setActive(user.isActive());
        response.setCreatedAt(user.getCreatedAt());
        response.setUpdatedAt(user.getUpdatedAt());

        Set<String> roles = new HashSet<>();
        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            for (Role role : user.getRoles()) {
                roles.add(role.getName());
            }
        }
        response.setRoles(roles);

        Set<String> permissions = new HashSet<>();

        // Permissions des rôles
        if (user.getRoles() != null) {
            for (Role role : user.getRoles()) {
                if (role.getPermissions() != null) {
                    for (PermissionEntity perm : role.getPermissions()) {
                        permissions.add(perm.getName());
                    }
                }
            }
        }



        return response;
    }
}
