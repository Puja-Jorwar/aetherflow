package com.aetherflow.controller;

import com.aetherflow.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/job-agent")
public class JobAgentController {

    private static final Map<String, Object> activeRun = Collections.synchronizedMap(new HashMap<>());
    private static final List<String> logs = new CopyOnWriteArrayList<>();

    static {
        activeRun.put("status", "idle");
        activeRun.put("logs", logs);
        activeRun.put("appliedCount", 0);
        activeRun.put("currentJob", "");
        activeRun.put("platform", "");
        activeRun.put("startTime", null);
    }

    private void addLog(String msg) {
        String timestamp = LocalTime.now().format(DateTimeFormatter.ofPattern("hh:mm:ss a"));
        logs.add("[" + timestamp + "] " + msg);
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse> getStatus() {
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Fetched job agent status successfully")
                .data(activeRun)
                .build());
    }

    @PostMapping("/run")
    public ResponseEntity<ApiResponse> startRun(@RequestBody Map<String, Object> body) {
        String jobTitle = (String) body.get("jobTitle");
        String location = (String) body.get("location");
        String platform = (String) body.get("platform");
        String email = (String) body.get("email");

        if (jobTitle == null || platform == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please provide jobTitle and platform parameters");
        }

        if ("running".equals(activeRun.get("status"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Another job application pipeline is already running");
        }

        // Spawn a background thread to simulate the agent
        new Thread(() -> {
            try {
                activeRun.put("status", "running");
                activeRun.put("startTime", Instant.now().toEpochMilli());
                activeRun.put("appliedCount", 0);
                activeRun.put("platform", platform);
                logs.clear();

                String platformName = "naukri".equals(platform) ? "Naukri.com" : "Indeed.com";

                addLog("🚀 Spawning headless Chromium instance (Puppeteer agent)...");
                Thread.sleep(1500);

                addLog("🔒 Navigating to secure " + platformName + " login portal...");
                Thread.sleep(1500);

                addLog("🔑 Authenticating user account: " + (email != null ? email : "portfolio-demo@aetherflow.io") + "...");
                Thread.sleep(1800);
                addLog("✅ Session established. Authentication cookies stored in memory cache.");
                Thread.sleep(1000);

                addLog("🔍 Executing job directory lookup: Query=\"" + jobTitle + "\", Location=\"" + (location != null ? location : "Remote") + "\"...");
                Thread.sleep(2000);

                List<Map<String, String>> sampleJobs = List.of(
                        Map.of("title", jobTitle + " Role", "company", "TechSolutions Global"),
                        Map.of("title", "Full-Stack Developer", "company", "Innovate Systems"),
                        Map.of("title", "Software Engineer (React/Node)", "company", "PixelCraft Labs")
                );

                int appliedCount = 0;
                for (Map<String, String> job : sampleJobs) {
                    String jobString = job.get("title") + " at " + job.get("company");
                    activeRun.put("currentJob", jobString);

                    addLog("📄 Navigating to matching listing: \"" + job.get("title") + "\" by " + job.get("company") + "...");
                    Thread.sleep(1500);

                    addLog("🖱️ Activating Easy Apply form element parser...");
                    Thread.sleep(1200);

                    addLog("📋 Form Schema parsed. Extracting questions...");
                    Thread.sleep(1500);

                    addLog("✍️ Injecting details: Name, Email, Resume text, and Portfolio links...");
                    Thread.sleep(1800);

                    addLog("🤖 Captcha verification solved via background solver.");
                    Thread.sleep(1500);

                    addLog("✅ Application submitted successfully for " + job.get("title") + "!");
                    appliedCount++;
                    activeRun.put("appliedCount", appliedCount);
                    Thread.sleep(1200);
                }

                activeRun.put("status", "completed");
                activeRun.put("currentJob", "");
                addLog("🏁 Headless browser closed. Automated run finished successfully!");

            } catch (InterruptedException e) {
                activeRun.put("status", "failed");
                addLog("❌ Heuristic Error encountered: " + e.getMessage());
            }
        }).start();

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Job Application automation agent spawned successfully")
                .data(Map.of("status", "running"))
                .build());
    }
}
