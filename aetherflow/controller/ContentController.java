package com.aetherflow.controller;

import com.aetherflow.config.LlmService;
import com.aetherflow.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/content")
public class ContentController {

    @Autowired
    private LlmService llmService;

    private String getMockContent(String type, String tone, String topic, List<String> keywords) {
        String kwString = keywords.isEmpty() ? "#AetherFlow" : 
                keywords.stream().map(k -> "#" + k.replaceAll("\\s+", "")).collect(Collectors.joining(" "));

        String lowercaseType = type.toLowerCase();
        if ("linkedin".equals(lowercaseType)) {
            return "🚀 [AetherFlow Content Generator - LinkedIn Preset (Tone: " + tone + ")]\n\n" +
                   "Let's talk about: \"" + topic + "\"!\n\n" +
                   "In today's fast-paced environment, matching developer velocity with robust software architecture is one of the hardest challenges engineering teams face.\n\n" +
                   "Here are 3 core takeaways:\n" +
                   "1️⃣ Automation first: If you do it twice, script it. If you do it three times, agenticize it.\n" +
                   "2️⃣ High-context retrieval: Giving models structured vector contexts solves hallucination.\n" +
                   "3️⃣ Developer loops: Clean routing and fast reload speeds build premium software.\n\n" +
                   "What are your thoughts on this topic? Let me know in the comments!\n\n" +
                   kwString + " #Engineering #TechLeadership #FullStack";
        }

        if ("tweet".equals(lowercaseType)) {
            return "🔥 [AetherFlow Content Generator - Tweet Preset]\n\n" +
                   "Struggling to optimize \"" + topic + "\"? \n\n" +
                   "The key is connecting structured pipeline data with AI routing filters. Fast, automated, and zero-headache.\n\n" +
                   "Check out how we built this using React + Node! 👇\n" +
                   kwString + " #buildinpublic #webdev";
        }

        if ("email".equals(lowercaseType)) {
            return "✉️ [AetherFlow Content Generator - Email Preset]\n\n" +
                   "Dear Team,\n\n" +
                   "I hope this email finds you well.\n\n" +
                   "Regarding our focus on \"" + topic + "\", I wanted to share a quick update on how we can streamline our productivity. By introducing modular task pipelines, we can automate key summary steps and keep stakeholders in the loop.\n\n" +
                   "Key points to review:\n" +
                   "• Action 1: Extract data chunks directly from PDFs.\n" +
                   "• Action 2: Audit text layouts using AI checks.\n" +
                   "• Action 3: Dispatch results directly to team webhooks.\n\n" +
                   "Please let me know your thoughts on this approach.\n\n" +
                   "Best regards,\n" +
                   "AetherFlow Auto-Draft";
        }

        return "📝 [AetherFlow Content Generator - " + type + " Preset (Tone: " + tone + ")]\n\n" +
               "Topic Analysis: \"" + topic + "\"\n\n" +
               "Automating tasks inside this domain requires structuring inputs, parsing relevant segments, and writing templates. By integrating custom filters, users can dynamically shift outputs to match professional expectations.\n\n" +
               "Keywords references: " + (keywords.isEmpty() ? "N/A" : String.join(", ", keywords));
    }

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse> generateContent(@RequestBody Map<String, Object> body) {
        String contentType = (String) body.get("contentType");
        String tone = (String) body.get("tone");
        String keywords = (String) body.get("keywords");
        String topic = (String) body.get("topic");

        if (contentType == null || topic == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please provide a contentType and topic");
        }

        List<String> keywordsList = keywords != null && !keywords.trim().isEmpty() ? 
                Arrays.stream(keywords.split(",")).map(String::trim).collect(Collectors.toList()) : 
                List.of();

        String generatedContent = "";

        if (llmService.isConfigured()) {
            String systemPrompt = "You are a professional AI Content Writer. Generate a highly polished, engaging piece of content.\n" +
                                   "Content Type: " + contentType + "\n" +
                                   "Tone: " + (tone != null ? tone : "Professional") + "\n" +
                                   "Keywords to incorporate: " + (keywordsList.isEmpty() ? "None" : String.join(", ", keywordsList));
            String userPrompt = "Write content about: \"" + topic + "\"";
            generatedContent = llmService.callGroq(systemPrompt, userPrompt);
        }

        if (generatedContent == null || generatedContent.isEmpty()) {
            generatedContent = getMockContent(contentType, tone != null ? tone : "Professional", topic, keywordsList);
        }

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("contentType", contentType);
        responseData.put("tone", tone != null ? tone : "Professional");
        responseData.put("topic", topic);
        responseData.put("content", generatedContent);

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Content generated successfully")
                .data(responseData)
                .build());
    }
}
