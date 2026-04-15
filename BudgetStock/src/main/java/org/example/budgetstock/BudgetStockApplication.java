package org.example.budgetstock;

import org.example.budgetstock.config.RsaKeys;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(RsaKeys.class)
public class BudgetStockApplication {

    public static void main(String[] args) {
        SpringApplication.run(BudgetStockApplication.class, args);
    }

}
