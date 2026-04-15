package com.example.security_stock.service;


import com.example.security_stock.entities.User;
import com.example.security_stock.repository.UserRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        // Convert roles and permissions to GrantedAuthority
        Set<GrantedAuthority> authorities = new HashSet<>();

        if (user.getRoles() != null) {
            user.getRoles().forEach(role -> {
                // Ajouter ROLE_ pour Spring Security
                authorities.add(new SimpleGrantedAuthority("ROLE_" + role.getName()));
                if (role.getPermissions() != null) {
                    role.getPermissions().forEach(perm -> authorities.add(new SimpleGrantedAuthority(perm.getName())));
                }
            });
        }



        // Return Spring Security UserDetails
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                user.isActive(),  // enabled
                true,             // accountNonExpired
                true,             // credentialsNonExpired
                true,             // accountNonLocked
                authorities
        );
    }
}
