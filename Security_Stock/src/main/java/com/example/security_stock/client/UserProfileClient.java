package com.example.security_stock.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "users-service", url = "http://localhost:8060")
public interface UserProfileClient {

    @DeleteMapping("/v1/user-profiles/{userId}")
    void deleteUserProfile(@PathVariable Integer userId);

}
