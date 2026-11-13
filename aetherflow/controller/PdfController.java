package com.aetherflow.controller;

import com.aetherflow.config.LlmService;
import com.aetherflow.dto.ApiResponse;
import com.aetherflow.model.Document;
import com.aetherflow.repository.DocumentRepository;
import com.aetherflow.security.UserPrincipal;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pdf")
public class PdfController {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private LlmService llmService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // RAG MATH HELPERS
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

    private List<String> getChunks(String text, int size, int overlap) {
        List<String> chunks = new ArrayList<>();
        int index = 0;
        while (index < text.length()) {
            int endIndex = Math.min(index + size, text.length());
            String chunk = text.substring(index, endIndex);
            chunks.add(chunk);
            if (endIndex == text.length()) {
                break;
            }
            index += size - overlap;
        }
        return chunks;
    }

    private List<Map<String, Object>> parseChunks(String json) {
        try {
            if (json == null || json.isEmpty()) return new ArrayList<>();
            return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private String stringifyChunks(List<Map<String, Object>> chunks) {
        try {
            if (chunks == null) return "[]";
            return objectMapper.writeValueAsString(chunks);
        } catch (Exception e) {
            return "[]";
        }
    }

    private String getMockRAGAnswer(List<Map<String, Object>> topChunks, String query) {
        String lowerQuery = query.toLowerCase();
        List<String> queryWords = Arrays.stream(lowerQuery.split("\\s+"))
                .filter(w -> w.length() > 3)
                .collect(Collectors.toList());

        Map<String, Object> bestChunk = topChunks.isEmpty() ? Map.of("text", "No text extracted.") : topChunks.get(0);
        int maxMatches = 0;

        for (Map<String, Object> chunk : topChunks) {
            String text = ((String) chunk.get("text")).toLowerCase();
            int matches = 0;
            for (String word : queryWords) {
                if (text.contains(word)) matches++;
            }
            if (matches > maxMatches) {
                maxMatches = matches;
                bestChunk = chunk;
            }
        }

        double score = bestChunk.containsKey("score") ? (Double) bestChunk.get("score") : 0.85;

        return "⚡ [AetherFlow Demo RAG Response] Based on the context matching your query (\"" + query + "\"), here is the extracted paragraph:\n\n" +
               "\"" + bestChunk.get("text") + "\"\n\n" +
               "[Citation: Similarity rating " + String.format("%.3f", score) + " | Overlap: " + maxMatches + " matching keyword(s)]";
    }

    // 1. UPLOAD PDF, PARSE, CHUNK, EMBED & SAVE
    @PostMapping("/upload")
    @Transactional
    public ResponseEntity<ApiResponse> uploadPdf(@AuthenticationPrincipal UserPrincipal principal, @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please upload a PDF file");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("application/pdf")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file type. Please upload a PDF.");
        }

        try {
            // A. Parse PDF
            String parsedText = "";
            try (PDDocument document = Loader.loadPDF(file.getBytes())) {
                PDFTextStripper stripper = new PDFTextStripper();
                parsedText = stripper.getText(document);
            } catch (Exception parseErr) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to parse PDF file. The file may be corrupt.");
            }

            String textContent = parsedText.replaceAll("\\s+", " ").trim();
            if (textContent.length() < 10) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No extractable text found in this PDF.");
            }

            // B. Chunk Text
            List<String> textChunks = getChunks(textContent, 800, 150);
            List<Map<String, Object>> dbChunks = new ArrayList<>();

            // C. Embed Chunks Locally
            for (String chunkText : textChunks) {
                Map<String, Object> chunkMap = new HashMap<>();
                chunkMap.put("text", chunkText);
                chunkMap.put("embedding", generateMockEmbedding(chunkText));
                dbChunks.add(chunkMap);
            }

            // D. Save Document
            Document doc = new Document();
            doc.setUserId(principal.getUser().getId());
            doc.setFilename(file.getOriginalFilename());
            doc.setSizeBytes(file.getSize());
            doc.setChunks(stringifyChunks(dbChunks));

            doc = documentRepository.save(doc);

            Map<String, Object> responseDoc = new HashMap<>();
            responseDoc.put("_id", doc.getId());
            responseDoc.put("id", doc.getId());
            responseDoc.put("filename", doc.getFilename());
            responseDoc.put("sizeBytes", doc.getSizeBytes());
            responseDoc.put("chunksCount", dbChunks.size());
            responseDoc.put("createdAt", doc.getCreatedAt());

            return new ResponseEntity<>(ApiResponse.builder()
                    .success(true)
                    .message("PDF uploaded and indexed successfully via RAG")
                    .data(responseDoc)
                    .build(), HttpStatus.CREATED);

        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "File reading error: " + e.getMessage());
        }
    }

    // 2. GET UPLOADED DOCUMENTS
    @GetMapping("/documents")
    public ResponseEntity<ApiResponse> getDocuments(@AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal.getUser().getId();
        List<Document> docs = documentRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<Map<String, Object>> response = docs.stream().map(doc -> {
            Map<String, Object> map = new HashMap<>();
            map.put("_id", doc.getId());
            map.put("id", doc.getId());
            map.put("filename", doc.getFilename());
            map.put("sizeBytes", doc.getSizeBytes());
            map.put("chunksCount", parseChunks(doc.getChunks()).size());
            map.put("createdAt", doc.getCreatedAt());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Documents list retrieved successfully")
                .data(response)
                .build());
    }

    // 3. QUERY PDF WITH RAG RETRIEVAL
    @PostMapping("/query")
    public ResponseEntity<ApiResponse> queryPdf(@AuthenticationPrincipal UserPrincipal principal, @RequestBody Map<String, Object> body) {
        String documentIdStr = (String) body.get("documentId");
        String query = (String) body.get("query");

        if (documentIdStr == null || query == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please provide documentId and query text");
        }

        UUID userId = principal.getUser().getId();
        List<Map<String, Object>> docChunks = new ArrayList<>();
        boolean isGlobal = "all".equals(documentIdStr);

        if (isGlobal) {
            List<Document> allDocs = documentRepository.findByUserIdOrderByCreatedAtDesc(userId);
            if (allDocs.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No documents found to query. Please upload a PDF first.");
            }
            for (Document d : allDocs) {
                List<Map<String, Object>> chunks = parseChunks(d.getChunks());
                for (Map<String, Object> c : chunks) {
                    Map<String, Object> flatChunk = new HashMap<>(c);
                    flatChunk.put("filename", d.getFilename());
                    docChunks.add(flatChunk);
                }
            }
        } else {
            UUID docId = UUID.fromString(documentIdStr);
            Document d = documentRepository.findByIdAndUserId(docId, userId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No document found with that ID or unauthorized"));
            List<Map<String, Object>> chunks = parseChunks(d.getChunks());
            for (Map<String, Object> c : chunks) {
                Map<String, Object> flatChunk = new HashMap<>(c);
                flatChunk.put("filename", d.getFilename());
                docChunks.add(flatChunk);
            }
        }

        // A. Generate Query Vector
        List<Double> queryVector = generateMockEmbedding(query);

        // B. Calculate Similarity scores
        List<Map<String, Object>> matches = new ArrayList<>();
        for (Map<String, Object> chunk : docChunks) {
            List<Double> embedding = (List<Double>) chunk.get("embedding");
            double score = cosineSimilarity(queryVector, embedding);

            Map<String, Object> match = new HashMap<>();
            match.put("text", chunk.get("text"));
            match.put("score", score);
            match.put("filename", chunk.get("filename"));
            matches.add(match);
        }

        // C. Sort chunks & Retrieve Top-3
        matches.sort((a, b) -> Double.compare((Double) b.get("score"), (Double) a.get("score")));
        List<Map<String, Object>> topChunks = matches.subList(0, Math.min(3, matches.size()));

        String contextText = topChunks.stream().map(m ->
                "[From Document: " + m.get("filename") + "]\n" + m.get("text")
        ).collect(Collectors.joining("\n\n"));

        String answer = "";
        if (llmService.isConfigured()) {
            String systemPrompt = "You are a helpful AI assistant. Answer the user's question based ONLY on the provided document context. If the answer cannot be determined from the context, state that you cannot find the answer in the document. Do not make things up.\n\n" +
                                   "Document Context:\n" +
                                   "----------------\n" +
                                   contextText + "\n" +
                                   "----------------";
            answer = llmService.callGroq(systemPrompt, query);
        }

        if (answer == null || answer.isEmpty()) {
            answer = getMockRAGAnswer(topChunks, query);
        }

        List<Map<String, Object>> citations = topChunks.stream().map(c -> {
            Map<String, Object> cit = new HashMap<>();
            cit.put("text", c.get("text"));
            cit.put("relevanceScore", c.get("score"));
            cit.put("filename", c.get("filename"));
            return cit;
        }).collect(Collectors.toList());

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("answer", answer);
        responseData.put("citations", citations);

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("RAG query completed successfully")
                .data(responseData)
                .build());
    }
}
