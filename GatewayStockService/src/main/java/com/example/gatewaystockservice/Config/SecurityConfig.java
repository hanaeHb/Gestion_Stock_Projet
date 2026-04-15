package com.example.gatewaystockservice.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@EnableWebFluxSecurity
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(csrf -> csrf.disable())
                .authorizeExchange(auth -> auth
                        .pathMatchers("/eureka/**").permitAll()
                        .pathMatchers("/security-stock/v1/users/**").permitAll()
                        .pathMatchers("/security-stock/**").permitAll()
                        .pathMatchers("/users-service/v1/user-profiles/**").permitAll()
                        .pathMatchers("/produit-stock/v1/**").permitAll()
                        .pathMatchers("/service-fournisseur/**").permitAll()
                        .pathMatchers("/service-commande/**").permitAll()
                        .pathMatchers("/quotation-service/**").permitAll()
                        .pathMatchers("/service-fournisseur/api-docs/**").permitAll()
                        .pathMatchers("/notification-service/**").permitAll()
                        .pathMatchers("/notification-service/api-docs/**").permitAll()
                        .pathMatchers("/service-fournisseur/uploads/**").permitAll()
                        .pathMatchers("/uploads/**").permitAll()
                        .pathMatchers("/actuator/**").permitAll()
                        .anyExchange().authenticated()
                )
                .oauth2ResourceServer(oauth -> oauth.jwt())
                .build();
    }
}
