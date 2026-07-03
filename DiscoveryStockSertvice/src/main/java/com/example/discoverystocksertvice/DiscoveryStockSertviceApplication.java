package com.example.discoverystocksertvice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@SpringBootApplication
@EnableEurekaServer
public class DiscoveryStockSertviceApplication {

    public static void main(String[] args) {
        SpringApplication.run(DiscoveryStockSertviceApplication.class, args);
    }

}
