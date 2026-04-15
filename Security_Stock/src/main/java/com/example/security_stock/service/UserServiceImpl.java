package com.example.security_stock.service;


import com.example.security_stock.dto.UserRequestDTO;
import com.example.security_stock.dto.UserResponseDTO;
import com.example.security_stock.entities.Role;
import com.example.security_stock.entities.User;
import com.example.security_stock.mapper.UserMapper;
import com.example.security_stock.repository.RefreshTokenRepository;
import com.example.security_stock.repository.RoleRepository;
import com.example.security_stock.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.example.security_stock.client.UserProfileClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserProfileClient userProfileClient;
    private  EmailService emailService;

    public UserServiceImpl(UserRepository userRepository,
                           RoleRepository roleRepository,
                           UserMapper userMapper,
                           PasswordEncoder passwordEncoder, RefreshTokenRepository refreshTokenRepository, UserProfileClient userProfileClient, EmailService emailService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenRepository = refreshTokenRepository;
        this.userProfileClient = userProfileClient;
        this.emailService = emailService;
    }

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Override
    public UserResponseDTO createUser(UserRequestDTO request) {
        // Vérifier si email existe déjà
        if(userRepository.existsByEmail(request.getEmail())){
            UserResponseDTO response = new UserResponseDTO();
            response.setEmail(request.getEmail());
            response.setActive(false);
            return response;
        }

        // Créer un nouvel utilisateur
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setActive(true);
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setCin(request.getCin());
        user.setPhone(request.getPhone());
        // Assigner le rôle si fourni
        if(request.getRole() != null && !request.getRole().isEmpty()){
            for (String roleName : request.getRole()) {
                Role role = roleRepository.findByName(roleName)
                        .orElseThrow(() -> new RuntimeException("Role non trouvé: " + roleName));
                user.getRoles().add(role);
            }
        }
        User savedUser = userRepository.save(user);

        return userMapper.Entity_to_DTO(savedUser);
    }

    @Override
    public UserResponseDTO createFour(UserRequestDTO request, MultipartFile cvFile) throws IOException{
        // Vérifier si email existe déjà
        if(userRepository.existsByEmail(request.getEmail())){
            UserResponseDTO response = new UserResponseDTO();
            response.setEmail(request.getEmail());
            response.setActive(false);
            return response;
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setActive(false);
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setCin(request.getCin());
        user.setPhone(request.getPhone());

        if(request.getRole() != null && !request.getRole().isEmpty()){
            for (String roleName : request.getRole()) {
                Role role = roleRepository.findByName(roleName)
                        .orElseThrow(() -> new RuntimeException("Role non trouvé: " + roleName));
                user.getRoles().add(role);
            }
        }
        if(cvFile != null && !cvFile.isEmpty()){
            String fileName = System.currentTimeMillis() + "_" + cvFile.getOriginalFilename();
            Path uploadPath = Paths.get("uploads/cv");
            if(!Files.exists(uploadPath)){
                Files.createDirectories(uploadPath);
            }
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(cvFile.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            user.setCvPath(filePath.toString()); // sauvegarde path f user
        }

        if(request.getRole() != null && !request.getRole().isEmpty()){
            for (String roleName : request.getRole()) {
                Role role = roleRepository.findByName(roleName)
                        .orElseThrow(() -> new RuntimeException("Role non trouvé: " + roleName));
                user.getRoles().add(role);
            }
        }
        User savedUser = userRepository.save(user);
        Map<String, Object> event = new HashMap<>();
        event.put("userId", savedUser.getId());
        event.put("email", savedUser.getEmail());
        event.put("firstName", savedUser.getFirstName());
        event.put("lastName", savedUser.getLastName());
        event.put("cin", savedUser.getCin());
        event.put("phone", savedUser.getPhone());
        event.put("role", "Fournisseur");
        event.put("cvPath", savedUser.getCvPath());

        kafkaTemplate.send("fournisseur-registered", event);

        return userMapper.Entity_to_DTO(savedUser);
    }

    @Override
    public UserResponseDTO createUserByAdmin(UserRequestDTO request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            UserResponseDTO response = new UserResponseDTO();
            response.setEmail(request.getEmail());
            response.setActive(false);
            return response;
        }

        // Creer user inactive
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setCin(request.getCin());
        user.setPhone(request.getPhone());
        user.setActive(true);


        if (request.getRole() != null && !request.getRole().isEmpty()) {
            for (String roleName : request.getRole()) {
                Role role = roleRepository.findByName(roleName)
                        .orElseThrow(() -> new RuntimeException("Role non trouvé: " + roleName));
                user.getRoles().add(role);
            }
        }

        // Verification token
        String token = UUID.randomUUID().toString();
        user.setVerificationToken(token);

        User savedUser = userRepository.save(user);

        // Send email notification
        String verifyLink = "http://localhost:3000/verify?token=" + token;
        try {
            emailService.sendEmail(user.getEmail(),
                    "Activate your account",
                    "Hello! Click this link to activate your account: " + verifyLink);
        } catch (Exception e) {
            e.printStackTrace();
        }

        return userMapper.Entity_to_DTO(savedUser);
    }

    @Override
    public UserResponseDTO getUserById(Integer id) {
        User user = userRepository.findById(id.intValue())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return userMapper.Entity_to_DTO(user);
    }

    @Override
    public List<UserResponseDTO> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(userMapper::Entity_to_DTO)
                .toList();
    }

    @Override
    @Transactional
    public void deleteUser(Integer id) {

        userProfileClient.deleteUserProfile(id);
        refreshTokenRepository.deleteByUserId(id);
        userRepository.deleteById(id);
    }

    @Override
    public UserResponseDTO assignRoleToUser(Integer userId, String roleName) {
        User user = userRepository.findById(userId.intValue())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        user.getRoles().add(role);
        userRepository.save(user); // Sauvegarder les changements

        return userMapper.Entity_to_DTO(user);
    }
    @Override
    public UserResponseDTO updateUserStatus(Integer id, Boolean active) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setActive(active);
        User updatedUser = userRepository.save(user);

        return userMapper.Entity_to_DTO(updatedUser);
    }

    @Override
    public UserResponseDTO updateUser(Integer id, Map<String, Object> updates) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (updates.containsKey("firstName")) user.setFirstName((String) updates.get("firstName"));
        if (updates.containsKey("lastName")) user.setLastName((String) updates.get("lastName"));
        if (updates.containsKey("email")) user.setEmail((String) updates.get("email"));
        if (updates.containsKey("phone")) user.setPhone((String) updates.get("phone"));
        if (updates.containsKey("cin")) user.setCin((String) updates.get("cin"));

        if (updates.containsKey("roles")) {
            @SuppressWarnings("unchecked")
            List<String> rolesList = (List<String>) updates.get("roles");
            Set<Role> newRoles = rolesList.stream()
                    .map(roleName -> roleRepository.findByName(roleName)
                            .orElseThrow(() -> new RuntimeException("Role not found: " + roleName)))
                    .collect(Collectors.toSet());
            user.getRoles().clear();
            user.getRoles().addAll(newRoles);
        }

        User updatedUser = userRepository.save(user);
        return userMapper.Entity_to_DTO(updatedUser);
    }
}
