package com.aetherflow.controller;

import com.aetherflow.config.LlmService;
import com.aetherflow.dto.ApiResponse;
import com.aetherflow.model.Chat;
import com.aetherflow.repository.ChatRepository;
import com.aetherflow.security.UserPrincipal;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chats")
public class ChatController {

    @Autowired
    private ChatRepository chatRepository;

    @Autowired
    private LlmService llmService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private Map<String, Object> mapChat(Chat chat) {
        if (chat == null) return null;
        Map<String, Object> map = new HashMap<>();
        map.put("_id", chat.getId());
        map.put("id", chat.getId());
        map.put("userId", chat.getUserId());
        map.put("title", chat.getTitle());
        map.put("messages", parseMessages(chat.getMessages()));
        map.put("createdAt", chat.getCreatedAt());
        return map;
    }

    private List<Map<String, Object>> parseMessages(String json) {
        try {
            if (json == null || json.isEmpty()) return new ArrayList<>();
            return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private String stringifyMessages(List<Map<String, Object>> messages) {
        try {
            if (messages == null) return "[]";
            return objectMapper.writeValueAsString(messages);
        } catch (Exception e) {
            return "[]";
        }
    }

    private String getMockResponse(String content) {
        String msg = content.toLowerCase();
        
        if (msg.contains("email")) {
            return "⚡ [AetherFlow Demo Response] Here is a professional internship email draft:\n\n" +
                   "Subject: Application for Software Engineering Internship - [Your Name]\n\n" +
                   "Dear Hiring Team,\n\n" +
                   "I am writing to express my interest in the Software Engineering Internship position at your company. As a computer science student with hands-on experience building full-stack applications (such as a multi-agent AI productivity platform built with React, Node, and PostgreSQL), I am eager to contribute to your engineering goals.\n\n" +
                   "In my recent projects, I developed:\n" +
                   "• Scalable backend architectures with Express.js and PostgreSQL.\n" +
                   "• RAG-based search services matching embeddings against documents.\n" +
                   "• Premium, glassmorphic dashboard layouts using Tailwind CSS.\n\n" +
                   "I would love the opportunity to discuss how my skill set aligns with your team's needs. Thank you for your time and consideration.\n\n" +
                   "Best regards,\n" +
                   "[Your Name]\n" +
                   "[Your Phone]\n" +
                   "[Your GitHub Link]";
        }
        
        if (msg.contains("linkedin") || msg.contains("post") || msg.contains("tweet")) {
            return "⚡ [AetherFlow Demo Response] Here is an engaging LinkedIn post template:\n\n" +
                   "🚀 How do you move from building \"basic chatbots\" to engineering scalable \"AI workflow automation engines\"?\n\n" +
                   "This week, I focused on implementing Retrieval-Augmented Generation (RAG) from scratch. Here's the pipeline:\n" +
                   "1️⃣ Text extraction from PDF documents using Node.\n" +
                   "2️⃣ Splitting paragraphs into optimized semantic chunks.\n" +
                   "3️⃣ Generating vector embeddings.\n" +
                   "4️⃣ Storing and performing cosine similarity lookups inside PostgreSQL.\n\n" +
                   "The result? An AI agent that answers queries using ONLY custom document context. No generic training data, no hallucinations—just high-context answers.\n\n" +
                   "Check out my portfolio project \"AetherFlow\" if you're interested in full-stack AI orchestration!\n\n" +
                   "#AI #WebDevelopment #SoftwareEngineering #PostgreSQL #React";
        }
        
        if (msg.contains("summarize")) {
            return "⚡ [AetherFlow Response] Here is a structured summary of the text:\n\n" +
                   "• **Primary Goal:** Consolidate data into actionable insights.\n" +
                   "• **Core Action Item:** Build out modular route segments (Auth, Chats, Prompts, RAG PDFs).\n" +
                   "• **Technical Focus:** Attach authentication guards to protect workspace details.\n" +
                   "• **Outcome:** Accelerated workflow pipelines that boost user productivity.";
        }

        return "⚡ [AetherFlow Demo Response] Hello! I am your AetherFlow AI assistant. \n\n" +
               "Since no Groq API key was configured in the server's `.env` file, I am running in **Interactive Demo Mode**. \n\n" +
               "Try asking me to:\n" +
               "• \"Write an **email** for my internship application\"\n" +
               "• \"Draft a **LinkedIn post** about AI development\"\n" +
               "• \"**Summarize** my meeting notes\"\n\n" +
               "Once you copy `.env.example` to `.env` and add your `GROQ_API_KEY`, I will automatically switch to live Llama completions!";
    }

    // 1. GET ALL CHATS
    @GetMapping
    public ResponseEntity<ApiResponse> getChats(@AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal.getUser().getId();
        List<Map<String, Object>> chats = chatRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::mapChat).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Chats retrieved successfully")
                .data(chats)
                .build());
    }

    // 2. CREATE NEW CHAT
    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse> createChat(@AuthenticationPrincipal UserPrincipal principal, @RequestBody Map<String, Object> body) {
        UUID userId = principal.getUser().getId();
        String title = (String) body.get("title");

        Chat chat = new Chat();
        chat.setUserId(userId);
        chat.setTitle(title != null ? title : "New Conversation");
        chat.setMessages("[]");

        chat = chatRepository.save(chat);

        return new ResponseEntity<>(ApiResponse.builder()
                .success(true)
                .message("Chat created successfully")
                .data(mapChat(chat))
                .build(), HttpStatus.CREATED);
    }

    // 3. GET SINGLE CHAT
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getChat(@AuthenticationPrincipal UserPrincipal principal, @PathVariable("id") UUID id) {
        UUID userId = principal.getUser().getId();
        Chat chat = chatRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No chat found with that ID"));
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Chat retrieved successfully")
                .data(mapChat(chat))
                .build());
    }

    // 4. SEND MESSAGE & RETRIEVE AI ANSWER
    @PostMapping("/{id}/messages")
    @Transactional
    public ResponseEntity<ApiResponse> sendMessage(@AuthenticationPrincipal UserPrincipal principal, @PathVariable("id") UUID id, @RequestBody Map<String, Object> body) {
        UUID userId = principal.getUser().getId();
        String content = (String) body.get("content");

        if (content == null || content.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message content cannot be empty");
        }

        Chat chat = chatRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No chat found with that ID"));

        List<Map<String, Object>> messages = parseMessages(chat.getMessages());

        // 1. Add User Message
        Map<String, Object> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", content);
        userMsg.put("timestamp", Instant.now().toString());
        messages.add(userMsg);

        // 2. Call Groq or fallback to mock
        String reply = "";
        if (llmService.isConfigured()) {
            List<Map<String, String>> groqMessages = new ArrayList<>();
            groqMessages.add(Map.of("role", "system", "content", "You are AetherFlow, a premium AI productivity assistant designed to help with email drafting, content generation, document analysis, and prompt engineering."));
            for (Map<String, Object> msg : messages) {
                String role = (String) msg.get("role");
                String text = (String) msg.get("content");
                groqMessages.add(Map.of(
                        "role", "assistant".equals(role) ? "assistant" : "user",
                        "content", text
                ));
            }
            reply = llmService.callGroqChat(groqMessages);
        }

        if (reply == null || reply.isEmpty()) {
            reply = getMockResponse(content);
        }

        // 3. Add Assistant Message
        Map<String, Object> assistantMsg = new HashMap<>();
        assistantMsg.put("role", "assistant");
        assistantMsg.put("content", reply);
        assistantMsg.put("timestamp", Instant.now().toString());
        messages.add(assistantMsg);

        // 4. Update title if needed
        String title = chat.getTitle();
        if ("New Conversation".equals(title) || "New Chat".equals(title)) {
            title = content.length() > 30 ? content.substring(0, 27) + "..." : content;
            chat.setTitle(title);
        }

        chat.setMessages(stringifyMessages(messages));
        chat = chatRepository.save(chat);

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("chat", mapChat(chat));
        responseData.put("reply", reply);

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Message processed successfully")
                .data(responseData)
                .build());
    }
}
