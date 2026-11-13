package com.aetherflow.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Service
public class LlmService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public String getApiKey() {
        String apiKey = System.getProperty("GROQ_API_KEY");
        if (apiKey == null || apiKey.isEmpty()) {
            apiKey = System.getenv("GROQ_API_KEY");
        }
        return apiKey;
    }

    public boolean isConfigured() {
        String key = getApiKey();
        return key != null && !key.isEmpty() && !key.contains("your_");
    }

    public String callGroq(String systemPrompt, String userPrompt) {
        if (!isConfigured()) {
            return null;
        }

        try {
            Map<String, Object> requestBody = Map.of(
                "model", "llama-3.1-8b-instant",
                "messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", userPrompt)
                )
            );

            String requestBodyJson = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + getApiKey())
                .POST(HttpRequest.BodyPublishers.ofString(requestBodyJson, StandardCharsets.UTF_8))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode rootNode = objectMapper.readTree(response.body());
                return rootNode.path("choices").get(0).path("message").path("content").asText().trim();
            } else {
                System.err.println("Groq API returned status code " + response.statusCode() + ": " + response.body());
            }
        } catch (Exception e) {
            System.err.println("Error calling Groq API: " + e.getMessage());
        }

        return null;
    }

    public String callGroqChat(List<Map<String, String>> messages) {
        if (!isConfigured()) {
            return null;
        }

        try {
            Map<String, Object> requestBody = Map.of(
                "model", "llama-3.1-8b-instant",
                "messages", messages
            );

            String requestBodyJson = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + getApiKey())
                .POST(HttpRequest.BodyPublishers.ofString(requestBodyJson, StandardCharsets.UTF_8))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode rootNode = objectMapper.readTree(response.body());
                return rootNode.path("choices").get(0).path("message").path("content").asText().trim();
            } else {
                System.err.println("Groq API returned status code " + response.statusCode() + ": " + response.body());
            }
        } catch (Exception e) {
            System.err.println("Error calling Groq API: " + e.getMessage());
        }

        return null;
    }
}
