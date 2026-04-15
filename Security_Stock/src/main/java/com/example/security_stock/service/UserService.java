package com.example.security_stock.service;


import com.example.security_stock.dto.UserRequestDTO;
import com.example.security_stock.dto.UserResponseDTO;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

public interface UserService {
    UserResponseDTO createUser(UserRequestDTO request);
    UserResponseDTO getUserById(Integer id);
    List<UserResponseDTO> getAllUsers();
    void deleteUser(Integer id);
    UserResponseDTO assignRoleToUser(Integer userId, String roleName);
    UserResponseDTO updateUserStatus(Integer id, Boolean active);
    UserResponseDTO updateUser(Integer id, Map<String, Object> updates);
    UserResponseDTO createUserByAdmin(UserRequestDTO request);
    UserResponseDTO createFour(UserRequestDTO request, MultipartFile cvFile) throws IOException;
}
