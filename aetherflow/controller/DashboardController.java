package com.aetherflow.controller;

import com.aetherflow.dto.ApiResponse;
import com.aetherflow.repository.ChatRepository;
import com.aetherflow.repository.PromptRepository;
import com.aetherflow.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private ChatRepository chatRepository;

    @Autowired
    private PromptRepository promptRepository;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse> getStats(@AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal.getUser().getId();
        
        long chatsCount = chatRepository.countByUserId(userId);
        long promptsCount = promptRepository.countByUserId(userId);
        long docsCount = 0; // Document model disabled matching Node index.js line 85

        List<Map<String, Object>> mockWorkflows = List.of(
            Map.of("id", "w1", "name", "Document Summarizer Pipeline", "status", "idle", "runs", 24, "lastRun", "10 mins ago"),
            Map.of("id", "w2", "name", "Slack Sentiment Notification Router", "status", "idle", "runs", 156, "lastRun", "2 hours ago"),
            Map.of("id", "w3", "name", "Lead Enrichment Sync", "status", "failed", "runs", 8, "lastRun", "Yesterday")
        );

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalRuns", chatsCount + docsCount * 2 + promptsCount);
        metrics.put("successRate", 95.7);
        metrics.put("averageExecutionTime", "1.2s");
        metrics.put("apiUsagePercentage", 42);

        Map<String, Object> counts = new HashMap<>();
        counts.put("chats", chatsCount);
        counts.put("documents", docsCount);
        counts.put("prompts", promptsCount + 4); // 4 system presets matching Node index.js line 107

        Map<String, Object> stats = new HashMap<>();
        stats.put("workflows", mockWorkflows);
        stats.put("metrics", metrics);
        stats.put("counts", counts);

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Dashboard statistics fetched successfully")
                .data(stats)
                .build());
    }
}
