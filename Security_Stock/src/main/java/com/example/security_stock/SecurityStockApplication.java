package com.example.security_stock;

import com.example.security_stock.config.RsaKeys;
import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
@OpenAPIDefinition(
        info = @Info(
                title = "Microservice de Sécurité",
                description = "API pour la gestion des utilisateurs, rôles et permissions",
                version = "1.0.0",
                contact = @Contact(
                        name = "hanae",
                        email = "hanaebertili@gmail.com"
                )
        ),
        servers = {
                @Server(
                        url = "http://localhost:8096",
                        description = "Serveur de développement"
                )
        }
)

@SpringBootApplication
@EnableFeignClients
@EnableConfigurationProperties(RsaKeys.class)
public class SecurityStockApplication {

    public static void main(String[] args) {
        SpringApplication.run(SecurityStockApplication.class, args);
    }

    @Bean
    public PasswordEncoder bCryptPasswordEncoder() {

        return new BCryptPasswordEncoder();
    }
}
