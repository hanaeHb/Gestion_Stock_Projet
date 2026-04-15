package org.example.produitstock_service;

import org.example.produitstock_service.config.RsaKeys;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
@EnableConfigurationProperties(RsaKeys.class)
public class ProduitStockServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProduitStockServiceApplication.class, args);
    }

}
