package org.example.produitstock_service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import java.math.BigDecimal;


@FeignClient(name = "budget-service", url = "http://localhost:8888/budgetstock/v1/budgets")
public interface BudgetClient {

    @PostMapping("/check-consume")
    ResponseEntity<String> consume(@RequestBody BigDecimal amount);
}