package com.aetherflow.controller;

import com.aetherflow.config.LlmService;
import com.aetherflow.dto.ApiResponse;
import com.aetherflow.model.Document;
import com.aetherflow.repository.DocumentRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/integrations")
public class IntegrationController {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private LlmService llmService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // RAG MATH HELPERS (Deterministic mock vectors for fallback matching Node code)
    private List<Double> generateMockEmbedding(String text) {
        List<Double> vec = new ArrayList<>(1536);
        for (int i = 0; i < 1536; i++) {
            double val = 0;
            for (int j = 0; j < Math.min(text.length(), 50); j++) {
                val += text.charAt(j) * Math.sin(i + j);
            }
            vec.add(Math.sin(val));
        }
        double sumSquare = 0;
        for (double v : vec) {
            sumSquare += v * v;
        }
        double magnitude = Math.sqrt(sumSquare);
        if (magnitude == 0) magnitude = 1;

        List<Double> normalized = new ArrayList<>(1536);
        for (double v : vec) {
            normalized.add(v / magnitude);
        }
        return normalized;
    }

    private double cosineSimilarity(List<Double> vecA, List<Double> vecB) {
        if (vecA.size() != vecB.size()) return 0;
        double dotProduct = 0;
        for (int i = 0; i < vecA.size(); i++) {
            dotProduct += vecA.get(i) * vecB.get(i);
        }
        return dotProduct;
    }

    private List<Map<String, Object>> parseChunks(String json) {
        try {
            if (json == null || json.isEmpty()) return new ArrayList<>();
            return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private String runRAGQuery(String queryText) {
        try {
            List<Document> docs = documentRepository.findAll();
            if (docs.isEmpty()) {
                return "I couldn't find any uploaded documents in my database. Please upload a PDF first in the dashboard.";
            }

            List<Double> queryVector = generateMockEmbedding(queryText);
            List<Map<String, Object>> docChunks = new ArrayList<>();

            for (Document d : docs) {
                List<Map<String, Object>> chunks = parseChunks(d.getChunks());
                for (Map<String, Object> c : chunks) {
                    Map<String, Object> flatChunk = new HashMap<>(c);
                    flatChunk.put("filename", d.getFilename());
                    docChunks.add(flatChunk);
                }
            }

            List<Map<String, Object>> matches = new ArrayList<>();
            for (Map<String, Object> chunk : docChunks) {
                List<Double> embedding = (List<Double>) chunk.get("embedding");
                double score = cosineSimilarity(queryVector, embedding);

                Map<String, Object> m = new HashMap<>();
                m.put("text", chunk.get("text"));
                m.put("score", score);
                m.put("filename", chunk.get("filename"));
                matches.add(m);
            }

            matches.sort((a, b) -> Double.compare((Double) b.get("score"), (Double) a.get("score")));
            List<Map<String, Object>> topChunks = matches.subList(0, Math.min(3, matches.size()));

            if (topChunks.isEmpty()) {
                return "No matching context found.";
            }

            String contextText = topChunks.stream().map(m ->
                    "[From Document: " + m.get("filename") + "]\n" + m.get("text")
            ).collect(Collectors.joining("\n\n"));

            if (llmService.isConfigured()) {
                String systemPrompt = "You are a helpful AI assistant. Answer the user's question based ONLY on the provided document context. If the answer cannot be determined from the context, state that you cannot find the answer. Do not make things up.\n\n" +
                                       "Document Context:\n" +
                                       "----------------\n" +
                                       contextText + "\n" +
                                       "----------------";
                String answer = llmService.callGroq(systemPrompt, queryText);
                if (answer != null && !answer.isEmpty()) {
                    return answer;
                }
            }

            Map<String, Object> bestChunk = topChunks.get(0);
            double score = bestChunk.containsKey("score") ? (Double) bestChunk.get("score") : 0.85;

            return "[Mock Offline Answer for: \"" + queryText + "\"]\n" +
                   "Based on matched context from " + bestChunk.get("filename") + ": \"" + bestChunk.get("text") + "\"";

        } catch (Exception e) {
            System.err.println("RAG process failed in integrations: " + e.getMessage());
            return "Error processing request: " + e.getMessage();
        }
    }

    private void postWebhook(String url, Map<String, Object> payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
                    .build();
            client.send(request, HttpResponse.BodyHandlers.discarding());
        } catch (Exception e) {
            System.err.println("Webhook delivery failed: " + e.getMessage());
        }
    }

    // 1. FETCH SLACK CHANNELS LIST
    @GetMapping("/slack/channels")
    public ResponseEntity<ApiResponse> getSlackChannels() {
        String token = System.getProperty("SLACK_BOT_TOKEN");
        if (token == null || token.isEmpty()) token = System.getenv("SLACK_BOT_TOKEN");

        if (token == null || token.isEmpty() || token.contains("your_")) {
            List<Map<String, String>> devChannels = List.of(
                Map.of("id", "C123", "name", "#general"),
                Map.of("id", "C456", "name", "#random"),
                Map.of("id", "C789", "name", "#aetherflow-notifications")
            );
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Fetched mock Slack channels (token not set)")
                    .data(devChannels)
                    .build());
        }

        try {
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://slack.com/api/conversations.list?types=public_channel"))
                    .header("Authorization", "Bearer " + token)
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode root = objectMapper.readTree(response.body());

            if (!root.path("ok").asBoolean()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Slack API Error: " + root.path("error").asText());
            }

            List<Map<String, String>> channels = new ArrayList<>();
            for (JsonNode ch : root.path("channels")) {
                channels.add(Map.of(
                    "id", ch.path("id").asText(),
                    "name", "#" + ch.path("name").asText()
                ));
            }

            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Fetched Slack channels successfully")
                    .data(channels)
                    .build());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Slack integrations failed: " + e.getMessage());
        }
    }

    // 2. SLACK EVENTS API LISTENER (Public Webhook)
    @PostMapping(value = "/slack/events", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> slackEvents(@RequestBody Map<String, Object> body) {
        String type = (String) body.get("type");

        if ("url_verification".equals(type)) {
            String challenge = (String) body.get("challenge");
            return ResponseEntity.ok(challenge);
        }

        Map<String, Object> event = (Map<String, Object>) body.get("event");
        if (event != null && "app_mention".equals(event.get("type"))) {
            String channel = (String) event.get("channel");
            String originalText = (String) event.get("text");
            String ts = (String) event.get("ts");

            String cleanText = originalText != null ? originalText.replaceAll("<@[^>]+>", "").trim() : "";

            // Run RAG and respond back asynchronously
            new Thread(() -> {
                String answer = runRAGQuery(cleanText);
                String token = System.getProperty("SLACK_BOT_TOKEN");
                if (token == null || token.isEmpty()) token = System.getenv("SLACK_BOT_TOKEN");

                if (token != null && !token.isEmpty() && !token.contains("your_")) {
                    Map<String, Object> payload = Map.of(
                        "channel", channel,
                        "text", "👋 Hello! Here is the answer to your query:\n\n" + answer,
                        "thread_ts", ts
                    );
                    postWebhook("https://slack.com/api/chat.postMessage", payload);
                } else {
                    System.out.println("[Slack Event Bot Mock Reply to channel " + channel + "]: " + answer);
                }
            }).start();

            // Return 200 OK within 3 seconds to avoid Slack retry attempts
            return ResponseEntity.ok(Map.of("ok", true));
        }

        return ResponseEntity.ok(Map.of("ok", true));
    }

    // 3. SLACK SLASH COMMANDS (Public Endpoint)
    @PostMapping(value = "/slack/command", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<Map<String, Object>> slackCommand(@RequestParam("text") String text, @RequestParam("response_url") String responseUrl) {
        if (text == null || text.trim().isEmpty()) {
            return ResponseEntity.ok(Map.of(
                "response_type", "ephemeral",
                "text", "Please provide a search query. E.g. `/ask-aetherflow What is the status of the project?`"
            ));
        }

        // Reply immediately that query is processing
        new Thread(() -> {
            String answer = runRAGQuery(text);
            if (responseUrl != null && !responseUrl.isEmpty()) {
                Map<String, Object> payload = Map.of(
                    "response_type", "in_channel",
                    "text", "🔍 *AetherFlow RAG Answer for:* \"" + text + "\"\n\n" + answer
                );
                postWebhook(responseUrl, payload);
            }
        }).start();

        return ResponseEntity.ok(Map.of(
            "response_type", "ephemeral",
            "text", "⏳ *AetherFlow RAG Engine:* Searching indexed documents and compiling answer..."
        ));
    }

    // 4. POST TO SLACK WEBHOOK
    @PostMapping("/slack")
    public ResponseEntity<ApiResponse> postSlack(@RequestBody Map<String, Object> body) {
        String webhookUrl = (String) body.get("webhookUrl");
        String text = (String) body.get("text");

        if (webhookUrl == null || text == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please provide webhookUrl and text content");
        }

        Map<String, Object> payload = Map.of(
            "text", text,
            "username", "AetherFlow Bot",
            "icon_emoji", ":zap:"
        );
        postWebhook(webhookUrl, payload);

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Successfully posted message to Slack channel")
                .build());
    }

    // 5. POST TO DISCORD WEBHOOK
    @PostMapping("/discord")
    public ResponseEntity<ApiResponse> postDiscord(@RequestBody Map<String, Object> body) {
        String webhookUrl = (String) body.get("webhookUrl");
        String text = (String) body.get("text");

        if (webhookUrl == null || text == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please provide webhookUrl and text content");
        }

        String discordContent = text;
        if (discordContent.length() > 2000) {
            discordContent = discordContent.substring(0, 1990) + "...";
        }

        Map<String, Object> payload = Map.of(
            "content", discordContent,
            "username", "AetherFlow Bot"
        );
        postWebhook(webhookUrl, payload);

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Successfully posted message to Discord channel")
                .build());
    }
}
