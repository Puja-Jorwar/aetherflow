package com.aetherflow.controller;

import com.aetherflow.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<ApiResponse> health() {
        long uptimeMs = ManagementFactory.getRuntimeMXBean().getUptime();
        double uptimeSec = uptimeMs / 1000.0;

        Map<String, Object> dbStatus = new HashMap<>();
        dbStatus.put("status", "Connected");
        dbStatus.put("readyState", 1);

        Map<String, Object> healthData = new HashMap<>();
        healthData.put("status", "UP");
        healthData.put("timestamp", ZonedDateTime.now());
        healthData.put("uptime", uptimeSec);
        healthData.put("database", dbStatus);

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("System is healthy")
                .data(healthData)
                .build());
    }
}
