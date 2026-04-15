//package com.example.security_stock.config;
//
//
//import com.example.security_stock.entities.PermissionEntity;
//import com.example.security_stock.entities.Role;
//import com.example.security_stock.entities.User;
//import com.example.security_stock.repository.PermissionEntityRepository;
//import com.example.security_stock.repository.RoleRepository;
//import com.example.security_stock.repository.UserRepository;
//import org.springframework.boot.CommandLineRunner;
//import org.springframework.security.crypto.password.PasswordEncoder;
//import org.springframework.stereotype.Component;
//
//import java.util.HashSet;
//import java.util.Set;
//
//@Component
//public class DataInitializer implements CommandLineRunner {
//
//    private final UserRepository userRepository;
//    private final RoleRepository roleRepository;
//    private final PermissionEntityRepository permissionRepository;
//    private final PasswordEncoder passwordEncoder;
//
//    public DataInitializer(UserRepository userRepository,
//                           RoleRepository roleRepository,
//                           PermissionEntityRepository permissionRepository,
//                           PasswordEncoder passwordEncoder) {
//        this.userRepository = userRepository;
//        this.roleRepository = roleRepository;
//        this.permissionRepository = permissionRepository;
//        this.passwordEncoder = passwordEncoder;
//    }
//
//    @Override
//    public void run(String... args) throws Exception {
//
//        String[] defaultPermissions = {"USER_CREATE", "USER_READ", "USER_UPDATE", "USER_DELETE"};
//        Set<PermissionEntity> permissions = new HashSet<>();
//        for (String permName : defaultPermissions) {
//            PermissionEntity perm = permissionRepository.findByName(permName)
//                    .orElseGet(() -> {
//                        PermissionEntity p = new PermissionEntity();
//                        p.setName(permName);
//                        return permissionRepository.save(p);
//                    });
//            permissions.add(perm);
//        }
//
//        Role adminRole = roleRepository.findByName("ADMIN")
//                .orElseGet(() -> {
//                    Role role = new Role();
//                    role.setName("ADMIN");
//                    role.setDescription("Role administrateur principal");
//                    role.setPermissions(permissions);
//                    return roleRepository.save(role);
//                });
//
//        boolean adminExists = userRepository.findAll().stream()
//                .anyMatch(u -> u.getRoles().contains(adminRole));
//
//        if (!adminExists) {
//            User adminUser = new User();
//            adminUser.setEmail("GOadMi00nOw88l@stoGOck.com");
//            adminUser.setPassword(passwordEncoder.encode("adOmGWilnSt123"));
//            adminUser.setActive(true);
//            adminUser.setFirstName("AdminGO");
//            adminUser.setLastName("AdminGO");
//            adminUser.getRoles().add(adminRole);
//
//            userRepository.save(adminUser);
//            System.out.println("✅ Admin user et permissions créés avec succès !");
//        } else {
//            System.out.println("ℹ Admin user déjà existant, aucune action prise.");
//        }
//    }
//}
