package com.example.security_stock.web;


import com.example.security_stock.dto.RefreshTokenRequestDTO;
import com.example.security_stock.dto.UserRequestDTO;
import com.example.security_stock.dto.UserResponseDTO;
import com.example.security_stock.entities.RefreshToken;
import com.example.security_stock.entities.User;
import com.example.security_stock.mapper.UserMapper;
import com.example.security_stock.repository.RoleRepository;
import com.example.security_stock.repository.UserRepository;
import com.example.security_stock.service.RefreshTokenService;
import com.example.security_stock.service.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.web.bind.annotation.*;
import com.example.security_stock.entities.Role;
import com.example.security_stock.entities.PermissionEntity;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Tag(name = "Users", description = "API pour la gestion des utilisateurs")
@RestController
@RequestMapping("/v1/users")
@Tag(name = "Users", description = "API pour la gestion des utilisateurs")
public class UserController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtEncoder jwtEncoder;
    private final UserRepository userRepository;
    private final RefreshTokenService refreshTokenService;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    public UserController(UserService userService, AuthenticationManager authenticationManager, JwtEncoder jwtEncoder,
                          UserRepository userRepository, RefreshTokenService refreshTokenService,
                          RoleRepository roleRepository, PasswordEncoder passwordEncoder, UserMapper userMapper) {
        this.userService = userService;
        this.authenticationManager = authenticationManager;
        this.jwtEncoder = jwtEncoder;
        this.userRepository = userRepository;
        this.refreshTokenService = refreshTokenService;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.userMapper = userMapper;
    }

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;
    // --- CREATE USER ---
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/create")
    public ResponseEntity<UserResponseDTO> creatUser(@RequestBody UserRequestDTO request) {
        UserResponseDTO response = userService.createUser(request);

        if (!response.isActive()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // --- GET USER BY ID ---
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Integer id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // --- GET ALL USERS ---
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {

        List<UserResponseDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    // --- DELETE USER ---
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Integer id) {
        userService.deleteUser(id);
        return ResponseEntity.ok("Utilisateur supprimé avec succès");
    }

    // --- ASSIGN ROLE ---
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{userId}/roles")
    public ResponseEntity<UserResponseDTO> assignRoleToUser(@PathVariable Integer userId, @RequestParam String roleName) {
        return ResponseEntity.ok(userService.assignRoleToUser(userId, roleName));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/user/{id}")
    public ResponseEntity<UserResponseDTO> updateUser(@PathVariable Integer id, @RequestBody Map<String, Object> updates) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Update basic fields
        if (updates.containsKey("firstName")) user.setFirstName((String) updates.get("firstName"));
        if (updates.containsKey("lastName")) user.setLastName((String) updates.get("lastName"));
        if (updates.containsKey("email")) user.setEmail((String) updates.get("email"));
        if (updates.containsKey("phone")) user.setPhone((String) updates.get("phone"));
        if (updates.containsKey("cin")) user.setCin((String) updates.get("cin"));

        // Update roles if provided
        if (updates.containsKey("roles")) {
            @SuppressWarnings("unchecked")
            List<String> rolesList = (List<String>) updates.get("roles");
            Set<Role> newRoles = rolesList.stream()
                    .map(roleName -> roleRepository.findByName(roleName)
                            .orElseThrow(() -> new RuntimeException("Role non trouvé: " + roleName)))
                    .collect(Collectors.toSet());
            user.setRoles(newRoles);
        }

        User updatedUser = userRepository.save(user);
        UserResponseDTO response = userMapper.Entity_to_DTO(updatedUser);
        return ResponseEntity.ok(response);
    }

    // --- UPDATE USER STATUS ---
    @PreAuthorize("hasAnyRole('ADMIN','Procurement Manager')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<UserResponseDTO> updateUserStatus(@PathVariable Integer id, @RequestBody Map<String, Boolean> request) {
        Boolean active = request.get("active");
        if (active == null) return ResponseEntity.badRequest().build();

        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        user.setActive(active);
        User updatedUser = userRepository.save(user);

        UserResponseDTO response = userMapper.Entity_to_DTO(updatedUser);
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}")
    public ResponseEntity<UserResponseDTO> updateAdminProfile(@PathVariable Integer id, @RequestBody Map<String, String> updates) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (updates.containsKey("phone")) user.setPhone(updates.get("phone"));
        if (updates.containsKey("cin")) user.setCin(updates.get("cin"));

        User updatedUser = userRepository.save(user);
        UserResponseDTO response = userMapper.Entity_to_DTO(updatedUser);
        return ResponseEntity.ok(response);
    }

    // --- REGISTER CLIENT ---
    @PostMapping("/register")
    public ResponseEntity<UserResponseDTO> registerUserClient(@ModelAttribute UserRequestDTO request) throws IOException {
        request.setRole(Set.of("Fournisseur"));
        MultipartFile cvFile = request.getCv();
        UserResponseDTO response = userService.createFour(request, cvFile);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // --- LOGIN ---
    @PostMapping("/login")
    public ResponseEntity<UserResponseDTO> login(@RequestBody UserRequestDTO request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

            Set<String> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
            Set<String> permissions = user.getRoles().stream()
                    .flatMap(r -> r.getPermissions().stream())
                    .map(PermissionEntity::getName).collect(Collectors.toSet());

            Instant now = Instant.now();
            String authorities = authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority).collect(Collectors.joining(" "));

            JwtClaimsSet claims = JwtClaimsSet.builder()
                    .issuer("microservice-security")
                    .issuedAt(now)
                    .expiresAt(now.plus(1, ChronoUnit.HOURS))
                    .subject(authentication.getName())
                    .claim("authorities", authorities)
                    .claim("userID", user.getId())
                    .claim("email", user.getEmail())
                    .claim("prenom", user.getFirstName())
                    .claim("nom", user.getLastName())
                    .claim("cin", user.getCin())
                    .claim("phone", user.getPhone())
                    .claim("userId", user.getId())
                    .claim("roles", roles)
                    .claim("permissions", permissions)
                    .claim("type", "access")
                    .build();

            String accessToken = jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

            UserResponseDTO response = new UserResponseDTO();
            response.setId(user.getId());
            response.setEmail(user.getEmail());
            response.setFirstName(user.getFirstName());
            response.setLastName(user.getLastName());
            response.setActive(user.isActive());
            response.setCin(user.getCin());
            response.setPhone(user.getPhone());
            response.setRoles(roles);
            response.setAccessToken(accessToken);
            response.setRefreshToken(refreshToken.getToken());
            response.setTokenType("Bearer");
            response.setTokenExpiresIn(3600);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    // --- DOWNLOAD CV ---
    @PreAuthorize("hasAnyRole('ADMIN','Procurement Manager')")
    @GetMapping("/download/{fileName}")
    public ResponseEntity<byte[]> downloadCV(@PathVariable String fileName) {
        try {
            String userDir = System.getProperty("user.dir");

            java.nio.file.Path path1 = java.nio.file.Paths.get(userDir, "Security_Stock", "uploads", "cv", fileName).normalize();

            java.nio.file.Path path2 = java.nio.file.Paths.get(userDir, "uploads", "cv", fileName).normalize();

            java.nio.file.Path finalPath;

            if (java.nio.file.Files.exists(path1)) {
                finalPath = path1;
            } else if (java.nio.file.Files.exists(path2)) {
                finalPath = path2;
            } else {
                System.err.println("❌ File not found! Checked in: \n1: " + path1 + "\n2: " + path2);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            byte[] data = java.nio.file.Files.readAllBytes(finalPath);

            String contentType = java.nio.file.Files.probeContentType(finalPath);
            if (contentType == null) contentType = "application/octet-stream";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .body(data);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // --- REFRESH TOKEN ---
    @PostMapping("/refresh")
    public ResponseEntity<UserResponseDTO> refresh(@RequestBody RefreshTokenRequestDTO request) {
        try {
            RefreshToken refreshToken = refreshTokenService.verifyRefreshToken(request.getRefreshToken());
            User user = refreshToken.getUser();
            if (!user.isActive()) {
                refreshTokenService.revokeRefreshToken(refreshToken.getToken());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            Set<String> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
            Set<String> permissions = user.getRoles().stream()
                    .flatMap(r -> r.getPermissions().stream())
                    .map(PermissionEntity::getName).collect(Collectors.toSet());

            Instant now = Instant.now();
            JwtClaimsSet claims = JwtClaimsSet.builder()
                    .issuer("microservice-security")
                    .issuedAt(now)
                    .expiresAt(now.plus(1, ChronoUnit.HOURS))
                    .subject(user.getEmail())
                    .claim("email", user.getEmail())
                    .claim("userId", user.getId())
                    .claim("prenom", user.getFirstName())
                    .claim("nom", user.getLastName())
                    .claim("cin", user.getCin())
                    .claim("phone", user.getPhone())
                    .claim("roles", roles)
                    .claim("permissions", permissions)
                    .claim("type", "access")
                    .build();

            String newAccessToken = jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
            RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user.getId());
            refreshTokenService.revokeRefreshToken(refreshToken.getToken());

            UserResponseDTO response = new UserResponseDTO();
            response.setId(user.getId());
            response.setEmail(user.getEmail());
            response.setFirstName(user.getFirstName());
            response.setLastName(user.getLastName());
            response.setActive(user.isActive());
            response.setCin(user.getCin());
            response.setPhone(user.getPhone());
            response.setRoles(roles);
            response.setAccessToken(newAccessToken);
            response.setRefreshToken(newRefreshToken.getToken());
            response.setTokenType("Bearer");
            response.setTokenExpiresIn(3600);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    // --- LOGOUT ---
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestBody RefreshTokenRequestDTO request) {
        try {
            refreshTokenService.revokeRefreshToken(request.getRefreshToken());
            return ResponseEntity.ok("Déconnexion réussie");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Erreur lors de la déconnexion");
        }
    }

    // --- LOGOUT ALL ---
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/logout-all")
    public ResponseEntity<String> logoutAll(@RequestParam String email) {
        try {
            User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            refreshTokenService.revokeAllUserTokens(user.getId());
            return ResponseEntity.ok("Déconnexion de tous les appareils réussie");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Erreur");
        }
    }
}

