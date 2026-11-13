package com.aetherflow.controller;

import com.aetherflow.dto.ApiResponse;
import com.aetherflow.security.UserPrincipal;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/resume")
public class ResumeController {

    @PostMapping("/analyze")
    public ResponseEntity<ApiResponse> analyzeResume(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(value = "resume", required = false) MultipartFile file,
            @RequestParam(value = "text", required = false) String textBody
    ) {
        String text = "";
        String filename = "Text Paste";

        if (file != null && !file.isEmpty()) {
            String contentType = file.getContentType();
            if (contentType == null || !contentType.equals("application/pdf")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please upload a PDF Resume");
            }
            try (PDDocument document = Loader.loadPDF(file.getBytes())) {
                PDFTextStripper stripper = new PDFTextStripper();
                text = stripper.getText(document);
                filename = file.getOriginalFilename();
            } catch (Exception e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to parse PDF file. The file may be corrupt.");
            }
        } else if (textBody != null && !textBody.trim().isEmpty()) {
            text = textBody;
        }

        if (text == null || text.trim().length() < 50) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please provide sufficient resume text or upload a PDF");
        }

        Map<String, Object> analysis = analyzeResumeText(text);

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("filename", filename);
        responseData.put("analysis", analysis);

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Resume analyzed successfully")
                .data(responseData)
                .build());
    }

    private Map<String, Object> analyzeResumeText(String text) {
        String lowercase = text.toLowerCase();

        // Define Skill representation list
        List<SkillInfo> skillsList = Arrays.asList(
                new SkillInfo("React", lowercase.contains("react")),
                new SkillInfo("Node.js", lowercase.contains("node")),
                new SkillInfo("Express", lowercase.contains("express")),
                new SkillInfo("MongoDB", lowercase.contains("mongodb")),
                new SkillInfo("JavaScript", lowercase.contains("javascript") || lowercase.contains("js")),
                new SkillInfo("Python", lowercase.contains("python")),
                new SkillInfo("Git", lowercase.contains("git")),
                new SkillInfo("Docker", lowercase.contains("docker")),
                new SkillInfo("TypeScript", lowercase.contains("typescript") || lowercase.contains("ts")),
                new SkillInfo("SQL", lowercase.contains("sql"))
        );

        List<String> identifiedSkills = skillsList.stream()
                .filter(s -> s.found)
                .map(s -> s.name)
                .collect(Collectors.toList());

        List<String> missingSkills = skillsList.stream()
                .filter(s -> !s.found)
                .map(s -> s.name)
                .collect(Collectors.toList());

        // ATS score calculation
        int foundCount = identifiedSkills.size();
        int score = 30 + (foundCount * 7);
        if (lowercase.contains("education") || lowercase.contains("degree")) score += 10;
        if (lowercase.contains("experience") || lowercase.contains("work")) score += 15;
        if (score > 100) score = 98;

        List<String> recommendations = new ArrayList<>();
        if (!lowercase.contains("summary") && !lowercase.contains("objective")) {
            recommendations.add("Add a professional summary at the top to highlight key achievements.");
        }
        if (missingSkills.size() > 3) {
            List<String> sub = missingSkills.subList(0, Math.min(3, missingSkills.size()));
            recommendations.add("Consider adding keywords for missing skills: " + String.join(", ", sub) + ".");
        }
        if (!lowercase.contains("github") && !lowercase.contains("linkedin")) {
            recommendations.add("Include links to your GitHub and LinkedIn profiles in your header contact details.");
        }
        
        // Count words
        String[] words = text.trim().split("\\s+");
        if (words.length < 150) {
            recommendations.add("Your resume is thin. Expand your experience descriptions with bullet points outlining specific outcomes.");
        }

        if (recommendations.isEmpty()) {
            recommendations.add("Resume formatting looks highly optimized! Ensure bullet points contain metric metrics (e.g., \"Improved load speed by 30%\").");
        }

        Map<String, Object> analysisMap = new HashMap<>();
        analysisMap.put("atsScore", score);
        analysisMap.put("skillsIdentified", identifiedSkills);
        analysisMap.put("skillsMissing", missingSkills);
        analysisMap.put("recommendations", recommendations);
        analysisMap.put("atsStatus", score >= 80 ? "Highly Match" : score >= 60 ? "Needs Optimization" : "Poor Match");

        return analysisMap;
    }

    private static class SkillInfo {
        String name;
        boolean found;

        SkillInfo(String name, boolean found) {
            this.name = name;
            this.found = found;
        }
    }
}
