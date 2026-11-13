package com.aetherflow.controller;

import com.aetherflow.dto.ApiResponse;
import com.aetherflow.model.Prompt;
import com.aetherflow.repository.PromptRepository;
import com.aetherflow.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/prompts")
public class PromptController {

    @Autowired
    private PromptRepository promptRepository;

    private static final List<Map<String, Object>> SYSTEM_PRESETS = List.of(
        Map.of(
            "_id", "preset-1",
            "id", "preset-1",
            "title", "LinkedIn Post Builder",
            "promptText", "Write an engaging, professional LinkedIn post about [Topic] using relevant formatting, emojis, and hashtags. Keep the tone inspiring and highlight key challenges and solutions.",
            "category", "Marketing",
            "isPreset", true
        ),
        Map.of(
            "_id", "preset-2",
            "id", "preset-2",
            "title", "Professional Email Refiner",
            "promptText", "Refine the following rough text into a polite, clear, and professional email: \n\n\"[Input text]\"",
            "category", "Writing",
            "isPreset", true
        ),
        Map.of(
            "_id", "preset-3",
            "id", "preset-3",
            "title", "Python/JS Code Explainer",
            "promptText", "Analyze the following code snippet and explain its functionality step-by-step in simple language. Also point out potential optimizations: \n\n[Insert code]",
            "category", "Development",
            "isPreset", true
        ),
        Map.of(
            "_id", "preset-4",
            "id", "preset-4",
            "title", "ATS Resume Keyword Matcher",
            "promptText", "Compare my resume skills list: \"[Skills]\" against this target job description: \"[Job Description]\". Identify missing keywords and suggest formatting adjustments to bypass ATS screens.",
            "category", "Productivity",
            "isPreset", true
        )
    );

    private Map<String, Object> mapPrompt(Prompt prompt) {
        if (prompt == null) return null;
        Map<String, Object> map = new HashMap<>();
        map.put("_id", prompt.getId());
        map.put("id", prompt.getId());
        map.put("title", prompt.getTitle());
        map.put("promptText", prompt.getPromptText());
        map.put("category", prompt.getCategory());
        map.put("createdAt", prompt.getCreatedAt());
        return map;
    }

    // 1. GET ALL PROMPTS
    @GetMapping
    public ResponseEntity<ApiResponse> getPrompts(@AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal.getUser().getId();
        List<Map<String, Object>> userPrompts = promptRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::mapPrompt).collect(Collectors.toList());

        List<Map<String, Object>> allPrompts = new ArrayList<>();
        allPrompts.addAll(SYSTEM_PRESETS);
        allPrompts.addAll(userPrompts);

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Prompts fetched successfully")
                .data(allPrompts)
                .build());
    }

    // 2. CREATE NEW PROMPT
    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse> createPrompt(@AuthenticationPrincipal UserPrincipal principal, @RequestBody Map<String, Object> body) {
        UUID userId = principal.getUser().getId();
        String title = (String) body.get("title");
        String promptText = (String) body.get("promptText");
        String category = (String) body.get("category");

        if (title == null || promptText == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please provide a title and prompt text");
        }

        Prompt prompt = new Prompt();
        prompt.setUserId(userId);
        prompt.setTitle(title);
        prompt.setPromptText(promptText);
        prompt.setCategory(category != null ? category : "General");

        prompt = promptRepository.save(prompt);

        return new ResponseEntity<>(ApiResponse.builder()
                .success(true)
                .message("Prompt saved successfully")
                .data(mapPrompt(prompt))
                .build(), HttpStatus.CREATED);
    }

    // 3. DELETE PROMPT
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse> deletePrompt(@AuthenticationPrincipal UserPrincipal principal, @PathVariable("id") UUID id) {
        UUID userId = principal.getUser().getId();
        Prompt prompt = promptRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No prompt found with that ID or unauthorized"));

        promptRepository.delete(prompt);

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Prompt deleted successfully")
                .build());
    }
}
