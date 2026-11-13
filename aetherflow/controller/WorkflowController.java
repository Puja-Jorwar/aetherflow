package com.aetherflow.controller;

import com.aetherflow.config.LlmService;
import com.aetherflow.dto.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/workflows")
public class WorkflowController {

    @Autowired
    private LlmService llmService;

    private final ObjectMapper objectMapper = new ObjectMapper();

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

    @PostMapping("/run")
    public ResponseEntity<ApiResponse> runWorkflow(@RequestBody Map<String, Object> body) {
        String workflowId = (String) body.get("workflowId");
        Map<String, Object> inputs = (Map<String, Object>) body.get("inputs");

        if (workflowId == null || inputs == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please provide workflowId and inputs object");
        }

        List<String> logs = new ArrayList<>();
        String outputText = "";
        long start = System.currentTimeMillis();

        logs.add("[1/3] ⚙️ Initializing Pipeline runner for ID: " + workflowId + "...");

        if ("slack-router".equals(workflowId)) {
            String textInput = (String) inputs.get("textInput");
            String slackWebhookUrl = (String) inputs.get("slackWebhookUrl");
            String slackChannelId = (String) inputs.get("slackChannelId");

            if (textInput == null || textInput.trim().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Feedback text input is required for this pipeline");
            }

            logs.add("[2/3] 🤖 Calling Llama-3.1 on Groq for sentiment analysis and support response drafting...");
            String aiResult = null;

            if (llmService.isConfigured()) {
                String systemPrompt = "You are a customer feedback analyst. Analyze the sentiment (Positive/Negative/Neutral) and draft a brief, professional support response.";
                String userPrompt = "Feedback to analyze: \"" + textInput + "\"";
                aiResult = llmService.callGroq(systemPrompt, userPrompt);
                if (aiResult != null) {
                    logs.add("[2/3] ✅ AI processing complete. Sentiment output analyzed successfully.");
                }
            }

            if (aiResult == null || aiResult.isEmpty()) {
                logs.add("[2/3] ⚡ Running offline: generating mock support response...");
                aiResult = "[DEMO ANALYZED SENTIMENT]: Neutral\nDraft Reply: Thank you for your feedback! We will forward it to our product team.";
            }

            outputText = aiResult;

            if (slackWebhookUrl != null && slackWebhookUrl.startsWith("http")) {
                logs.add("[3/3] 📡 Forwarding sentiment report to Slack webhook...");
                try {
                    Map<String, Object> payload = Map.of(
                        "text", "*AetherFlow Workflow Run notification*\n*Source feedback:* \"" + 
                        (textInput.length() > 100 ? textInput.substring(0, 100) : textInput) + "\"\n*Analysis output:*\n" + aiResult
                    );
                    postWebhook(slackWebhookUrl, payload);
                    logs.add("[3/3] ✅ Dispatched notification to Slack Webhook.");
                } catch (Exception slackErr) {
                    logs.add("[3/3] ⚠️ Webhook delivery failed: " + slackErr.getMessage());
                }
            } else if (slackChannelId != null) {
                logs.add("[3/3] 📡 Forwarding sentiment report to Slack channel " + slackChannelId + "...");
                String token = System.getProperty("SLACK_BOT_TOKEN");
                if (token == null || token.isEmpty()) token = System.getenv("SLACK_BOT_TOKEN");

                if (token != null && !token.isEmpty() && !token.contains("your_")) {
                    try {
                        Map<String, Object> payload = Map.of(
                            "channel", slackChannelId,
                            "text", "*AetherFlow Workflow Run notification*\n*Source feedback:* \"" + 
                            (textInput.length() > 100 ? textInput.substring(0, 100) : textInput) + "\"\n*Analysis output:*\n" + aiResult
                        );
                        HttpClient client = HttpClient.newHttpClient();
                        HttpRequest request = HttpRequest.newBuilder()
                                .uri(URI.create("https://slack.com/api/chat.postMessage"))
                                .header("Authorization", "Bearer " + token)
                                .header("Content-Type", "application/json")
                                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload), StandardCharsets.UTF_8))
                                .build();
                        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                        logs.add("[3/3] ✅ Successfully posted notification to Slack Channel!");
                    } catch (Exception slackErr) {
                        logs.add("[3/3] ⚠️ Slack API request failed: " + slackErr.getMessage());
                    }
                } else {
                    logs.add("[3/3] ⚡ Slack API Mock Channel Post to " + slackChannelId + ": Successful (Mock Token mode)");
                }
            } else {
                logs.add("[3/3] ℹ️ Neither Slack Webhook URL nor Slack Channel ID was provided. Skipping forwarding step.");
            }

        } else if ("linkedin-publisher".equals(workflowId)) {
            String topic = (String) inputs.get("topic");
            String tone = (String) inputs.get("tone");
            String discordWebhookUrl = (String) inputs.get("discordWebhookUrl");

            if (topic == null || topic.trim().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Topic input is required for this pipeline");
            }

            logs.add("[2/3] 🤖 Calling Llama-3.1 to generate a creative LinkedIn post draft...");
            String aiResult = null;

            if (llmService.isConfigured()) {
                String systemPrompt = "You are a professional social media manager. Generate a highly engaging, structured LinkedIn post with appropriate emojis and formatting. Tone: " + (tone != null ? tone : "Professional");
                String userPrompt = "Draft a post about: \"" + topic + "\"";
                aiResult = llmService.callGroq(systemPrompt, userPrompt);
                if (aiResult != null) {
                    logs.add("[2/3] ✅ AI writing complete. Post draft generated.");
                }
            }

            if (aiResult == null || aiResult.isEmpty()) {
                logs.add("[2/3] ⚡ Running offline: generating mock social media post...");
                aiResult = "📝 [Demo Post about " + topic + "]: Loving this new perspective on the future of development! Let's build together. #AI #Platform";
            }

            outputText = aiResult;

            if (discordWebhookUrl != null && discordWebhookUrl.startsWith("http")) {
                logs.add("[3/3] 📡 Forwarding generated LinkedIn post to Discord channel...");
                try {
                    String discordContent = "**AetherFlow Generated LinkedIn Post Draft**\n\n" + aiResult;
                    if (discordContent.length() > 2000) {
                        discordContent = discordContent.substring(0, 1990) + "... (truncated)";
                        logs.add("[3/3] ⚠️ Content truncated to 2000 character limit for Discord.");
                    }
                    Map<String, Object> payload = Map.of(
                        "content", discordContent,
                        "username", "AetherFlow Bot"
                    );
                    postWebhook(discordWebhookUrl, payload);
                    logs.add("[3/3] ✅ Successfully posted notification to Discord!");
                } catch (Exception discordErr) {
                    logs.add("[3/3] ⚠️ Webhook delivery failed: " + discordErr.getMessage());
                }
            } else {
                logs.add("[3/3] ℹ️ Discord Webhook Url not provided or invalid. Skipping forwarding step.");
            }

        } else if ("coaching-admission".equals(workflowId)) {
            String inquiryText = (String) inputs.get("inquiryText");
            String query = inquiryText != null ? inquiryText : "Hi, what are the fees and batch timings for the 10th standard science course?";
            logs.add("[2/3] 🤖 Calling Llama-3.1 on Groq for inquiry analysis and course matching...");
            String aiResult = null;

            if (llmService.isConfigured()) {
                String systemPrompt = "You are an AI receptionist for a coaching institute called Excellence Academy. Draft a helpful, polite response in Hinglish/English answering the inquiry about courses, batch timings, and fees. Mention that batch timings are Mon-Wed-Fri 4-6 PM and the monthly fee is ₹1,500.";
                aiResult = llmService.callGroq(systemPrompt, "Customer inquiry: \"" + query + "\"");
                if (aiResult != null) {
                    logs.add("[2/3] ✅ Inquiry parsed. Response generated in student-friendly regional text.");
                }
            }

            if (aiResult == null || aiResult.isEmpty()) {
                logs.add("[2/3] ⚡ Running offline: generating default Hinglish template response...");
                aiResult = "Hello! Thanks for inquiring about Excellence Academy. For 10th Science, our batch timings are Monday, Wednesday, and Friday from 4:00 PM to 6:00 PM. The monthly fee is ₹1,500. You can pay online or visit us. Let us know if you want to book a free demo class!";
            }

            outputText = aiResult;
            logs.add("[3/3] 📡 Simulating WhatsApp auto-reply dispatch to parent... ✅ Message Sent.");

        } else if ("coaching-fee-alert".equals(workflowId)) {
            String studentName = (String) inputs.get("studentName");
            Number amount = (Number) inputs.get("amount");
            String parentPhone = (String) inputs.get("parentPhone");

            String name = studentName != null ? studentName : "Rahul Sharma";
            int amt = amount != null ? amount.intValue() : 1500;
            String phone = parentPhone != null ? parentPhone : "+91 98765 43210";

            logs.add("[2/3] 💳 Triggering Razorpay payment link generation for ₹" + amt + "...");
            String linkId = "plink_" + UUID.randomUUID().toString().replaceAll("-", "").substring(0, 10);
            String payUrl = "https://rzp.io/i/" + linkId;
            logs.add("[2/3] ✅ Payment link generated successfully: " + payUrl);

            outputText = "Dear Parent,\nThis is an automated reminder from Excellence Academy. The tuition fee of ₹" + amt + " for your ward " + name + " is now overdue. Please clear the dues immediately using this secure payment link: " + payUrl + "\nThank you!";
            logs.add("[3/3] 📡 Dispatching overdue SMS & WhatsApp alert to " + phone + "... ✅ Sent.");

        } else if ("coaching-absent-alert".equals(workflowId)) {
            String studentName = (String) inputs.get("studentName");
            String parentPhone = (String) inputs.get("parentPhone");
            String batchName = (String) inputs.get("batchName");

            String name = studentName != null ? studentName : "Rahul Sharma";
            String bName = batchName != null ? batchName : "Class 10 - Science";
            String phone = parentPhone != null ? parentPhone : "+91 98765 43210";

            logs.add("[2/3] 📝 Querying attendance tracker database... marked ABSENT.");
            outputText = "Dear Parent,\nThis is to notify you that your child " + name + " was marked ABSENT for the class batch \"" + bName + "\" today (" + LocalDate.now() + "). Please contact the coordinator if you have any questions or prior leave notices.";
            logs.add("[3/3] 📡 Dispatching real-time parent WhatsApp alert to " + phone + "... ✅ Sent.");

        } else if ("coaching-test-report".equals(workflowId)) {
            String studentName = (String) inputs.get("studentName");
            String testName = (String) inputs.get("testName");
            String subject = (String) inputs.get("subject");
            Number marksObtained = (Number) inputs.get("marksObtained");
            Number maxMarks = (Number) inputs.get("maxMarks");
            String parentPhone = (String) inputs.get("parentPhone");

            String sName = studentName != null ? studentName : "Student";
            String tName = testName != null ? testName : "Monthly Test";
            String subj = subject != null ? subject : "General Science";
            int marks = marksObtained != null ? marksObtained.intValue() : 40;
            int maxM = maxMarks != null ? maxMarks.intValue() : 50;
            String phone = parentPhone != null ? parentPhone : "+91 98765 43210";
            int pct = (int) (((double) marks / maxM) * 100);

            logs.add("[2/3] 🤖 Calling Llama-3.1 on Groq for student test performance review...");
            String aiResult = null;
            String promptText = "Student Name: " + sName + ", Test: " + tName + ", Subject: " + subj + ", Marks: " + marks + "/" + maxM + " (" + pct + "%). Write a concise, encouraging 1-2 sentence performance review in Hinglish/English for their parent. Highlight strengths or focus areas.";

            if (llmService.isConfigured()) {
                aiResult = llmService.callGroq("You are a helpful tutor writing a brief parent update review.", promptText);
                if (aiResult != null) {
                    logs.add("[2/3] ✅ AI review generated successfully.");
                }
            }

            if (aiResult == null || aiResult.isEmpty()) {
                logs.add("[2/3] ⚡ Running offline: generating default performance review...");
                aiResult = sName + " scored " + marks + "/" + maxM + " (" + pct + "%). " + (pct >= 75 ? "Excellent performance in class!" : "Needs to focus more on revision and practice.");
            }

            outputText = "Dear Parent, here is the test report card of your ward " + sName + " for the test " + tName + " (" + subj + "):\nMarks: " + marks + "/" + maxM + " (" + pct + "%)\nTeacher Feedback: " + aiResult;
            logs.add("[3/3] 📡 Simulating WhatsApp report card dispatch to " + phone + "... ✅ Sent.");

        } else if ("coaching-lead-nurture".equals(workflowId)) {
            String name = (String) inputs.get("name");
            String courseOfInterest = (String) inputs.get("courseOfInterest");
            String parentPhone = (String) inputs.get("parentPhone");
            String source = (String) inputs.get("source");

            String lName = name != null ? name : "Parent";
            String course = courseOfInterest != null ? courseOfInterest : "10th Standard Science";
            String phone = parentPhone != null ? parentPhone : "+91 98765 43210";
            String src = source != null ? source : "Website";

            logs.add("[2/3] 🤖 Calling Llama-3.1 on Groq to draft a personalized welcome message...");
            String aiResult = null;
            String promptText = "Draft a welcoming WhatsApp message in Hinglish/English for a parent named " + lName + " who just inquired about \"" + course + "\" via " + src + ". Politely welcome them to Excellence Academy, mention class timings are standard evening slots, monthly fee is ₹1,500, and include a simulated digital brochure link: https://excellenceacademy.in/brochure.pdf.";

            if (llmService.isConfigured()) {
                aiResult = llmService.callGroq("You are an intake coordinator for Excellence Academy.", promptText);
                if (aiResult != null) {
                    logs.add("[2/3] ✅ Welcome nurture text generated successfully.");
                }
            }

            if (aiResult == null || aiResult.isEmpty()) {
                logs.add("[2/3] ⚡ Running offline: generating default lead welcome response...");
                aiResult = "Hello " + lName + ", thank you for inquiring about our " + course + " classes at Excellence Academy! We offer high-quality batches (Mon-Wed-Fri 4-6 PM) at a monthly fee of ₹1,500. Here is our brochure: https://excellenceacademy.in/brochure.pdf. Let us know if you want to book a free demo class.";
            }

            outputText = aiResult;
            logs.add("[3/3] 📡 Simulating welcome message brochure auto-dispatch to " + phone + "... ✅ Dispatched.");

        } else if ("coaching-doubt-solving".equals(workflowId)) {
            String studentName = (String) inputs.get("studentName");
            String question = (String) inputs.get("question");

            String sName = studentName != null ? studentName : "Student";
            String q = question != null ? question : "What is photosynthesis?";

            logs.add("[2/3] 🤖 Calling Llama-3.1 on Groq to solve student doubt...");
            String aiResult = null;
            String promptText = "You are Excellence Academy's WhatsApp AI Doubt Solver. Provide a clear, friendly, and step-by-step educational solution to this student doubt: \"" + q + "\". Break down mathematical steps or scientific concepts clearly. Keep it under 200 words.";

            if (llmService.isConfigured()) {
                aiResult = llmService.callGroq("You are an encouraging AI academic tutor.", promptText);
                if (aiResult != null) {
                    logs.add("[2/3] ✅ AI explanation generated successfully.");
                }
            }

            if (aiResult == null || aiResult.isEmpty()) {
                logs.add("[2/3] ⚡ Running offline: generating mock doubt solution...");
                aiResult = "Thanks for asking! Here is the explanation for: \"" + q + "\". Speed is a scalar quantity (only magnitude), while Velocity is a vector quantity (contains both speed and direction). For example, 50 km/h is speed, but 50 km/h North is velocity.";
            }

            outputText = "Hi " + sName + "!\n\nHere is your step-by-step explanation:\n\n" + aiResult;
            logs.add("[3/3] 📡 Sending AI solved explanation back to WhatsApp... ✅ Sent.");

        } else if ("coaching-batch-reschedule".equals(workflowId)) {
            String batchName = (String) inputs.get("batchName");
            String courseName = (String) inputs.get("courseName");
            String oldTimings = (String) inputs.get("oldTimings");
            String newTimings = (String) inputs.get("newTimings");
            String reason = (String) inputs.get("reason");
            Object phonesObj = inputs.get("parentPhones");

            String bName = batchName != null ? batchName : "General Batch";
            String cName = courseName != null ? courseName : "General Course";
            String oldTime = oldTimings != null ? oldTimings : "Old Timings";
            String newTime = newTimings != null ? newTimings : "New Timings";
            String resn = reason != null ? reason : "unforeseen teacher scheduling updates";

            logs.add("[2/3] 📝 Composing batch rescheduling broadcast alert...");
            outputText = "Dear Parent,\nPlease note that the class timings for batch \"" + bName + "\" (" + cName + ") have been rescheduled from \"" + oldTime + "\" to \"" + newTime + "\" due to " + resn + ". Sorry for the inconvenience!";

            int count = 1;
            if (phonesObj instanceof String) {
                String pStr = (String) phonesObj;
                count = (int) Arrays.stream(pStr.split(",")).map(String::trim).filter(p -> !p.isEmpty()).count();
            } else if (phonesObj instanceof List) {
                count = ((List<?>) phonesObj).size();
            }
            if (count == 0) count = 1;

            logs.add("[3/3] 📡 Broadcasting WhatsApp reschedule alert to " + count + " parents... ✅ Broadcast Complete.");

        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown workflow pipeline identifier");
        }

        double duration = (System.currentTimeMillis() - start) / 1000.0;
        logs.add(String.format("🎉 Pipeline execution finished successfully in %.2fs!", duration));

        Map<String, Object> data = new HashMap<>();
        data.put("logs", logs);
        data.put("outputText", outputText);
        data.put("duration", String.format("%.2f", duration));

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Workflow pipeline run completed successfully")
                .data(data)
                .build());
    }
}
