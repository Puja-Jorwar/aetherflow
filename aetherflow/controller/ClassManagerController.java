package com.aetherflow.controller;

import com.aetherflow.config.LlmService;
import com.aetherflow.dto.ApiResponse;
import com.aetherflow.model.*;
import com.aetherflow.repository.*;
import com.aetherflow.security.UserPrincipal;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/class-manager")
public class ClassManagerController {

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private BatchRepository batchRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private EnrollmentRepository enrollmentRepository;

    @Autowired
    private FeeInstallmentRepository feeInstallmentRepository;

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private DoubtRepository doubtRepository;

    @Autowired
    private LlmService llmService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // MAPPERS
    private Map<String, Object> mapStudent(StudentProfile sp) {
        if (sp == null) return null;
        Map<String, Object> map = new HashMap<>();
        map.put("_id", sp.getId());
        map.put("id", sp.getId());
        map.put("businessId", sp.getBusinessId());
        map.put("studentName", sp.getStudentName());
        map.put("parentName", sp.getParentName());
        map.put("parentPhone", sp.getParentPhone());
        map.put("email", sp.getEmail());
        map.put("admissionNumber", sp.getAdmissionNumber());
        map.put("joinedDate", sp.getJoinedDate());
        map.put("status", "Active");
        return map;
    }

    private Map<String, Object> mapLead(Lead l) {
        if (l == null) return null;
        Map<String, Object> map = new HashMap<>();
        map.put("_id", l.getId());
        map.put("id", l.getId());
        map.put("name", l.getStudentName());
        map.put("parentPhone", l.getPhone());
        map.put("email", l.getEmail());
        map.put("courseOfInterest", l.getCourseOfInterest() != null ? l.getCourseOfInterest() : "Science");
        map.put("source", l.getSource());
        map.put("status", l.getStatus());
        map.put("notes", l.getNotes() != null ? l.getNotes() : "");
        return map;
    }

    private Map<String, Object> mapDoubt(Doubt d) {
        if (d == null) return null;
        Map<String, Object> map = new HashMap<>();
        map.put("_id", d.getId());
        map.put("id", d.getId());
        map.put("studentName", d.getStudentName());
        map.put("question", d.getQuestion());
        map.put("aiResponse", d.getAiResponse());
        map.put("createdAt", d.getCreatedAt());
        return map;
    }

    private List<Map<String, Object>> parseScores(String json) {
        try {
            if (json == null || json.isEmpty()) return new ArrayList<>();
            return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private String stringifyScores(List<Map<String, Object>> scores) {
        try {
            if (scores == null) return "[]";
            return objectMapper.writeValueAsString(scores);
        } catch (Exception e) {
            return "[]";
        }
    }

    private UUID getOrCreateCourse(UUID businessId, String courseName) {
        return courseRepository.findByBusinessIdAndName(businessId, courseName)
                .map(Course::getId)
                .orElseGet(() -> {
                    Course course = new Course();
                    course.setBusinessId(businessId);
                    course.setName(courseName);
                    course.setTotalFees(BigDecimal.ZERO);
                    return courseRepository.save(course).getId();
                });
    }

    private void logMessage(UUID businessId, String senderType, String recipientPhone, String content, String platform, String status) {
        try {
            jdbcTemplate.update(
                "INSERT INTO messages (business_id, sender_type, recipient_phone, content, platform, status) VALUES (?, ?, ?, ?, ?, ?)",
                businessId, senderType, recipientPhone, content, platform, status
            );
        } catch (Exception e) {
            System.err.println("Error saving outbound message log: " + e.getMessage());
        }
    }

    // 1. GET ALL STUDENTS
    @GetMapping("/students")
    public ResponseEntity<ApiResponse> getStudents(@AuthenticationPrincipal UserPrincipal principal) {
        UUID businessId = principal.getUser().getBusinessId();
        List<Map<String, Object>> students = studentProfileRepository.findByBusinessIdOrderByCreatedAtDesc(businessId)
                .stream().map(this::mapStudent).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Students fetched successfully")
                .data(students)
                .build());
    }

    // 2. POST ENROLL STUDENT
    @PostMapping("/students")
    @Transactional
    public ResponseEntity<ApiResponse> enrollStudent(@AuthenticationPrincipal UserPrincipal principal, @RequestBody Map<String, Object> body) {
        UUID businessId = principal.getUser().getBusinessId();
        String studentName = (String) body.get("studentName");
        String parentName = (String) body.get("parentName");
        String parentPhone = (String) body.get("parentPhone");
        String email = (String) body.get("email");
        String admissionNumber = (String) body.get("admissionNumber");
        String joinedDateStr = (String) body.get("joinedDate");

        if (studentName == null || parentPhone == null || admissionNumber == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please provide studentName, parentPhone, and admissionNumber");
        }

        if (studentProfileRepository.findByBusinessIdAndAdmissionNumber(businessId, admissionNumber).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Admission Number " + admissionNumber + " already exists for your organization");
        }

        LocalDate joinedDate = joinedDateStr != null ? LocalDate.parse(joinedDateStr) : LocalDate.now();

        StudentProfile sp = new StudentProfile();
        sp.setBusinessId(businessId);
        sp.setStudentName(studentName);
        sp.setParentName(parentName != null ? parentName : "");
        sp.setParentPhone(parentPhone);
        sp.setEmail(email != null ? email : "");
        sp.setAdmissionNumber(admissionNumber);
        sp.setJoinedDate(joinedDate);

        sp = studentProfileRepository.save(sp);

        return new ResponseEntity<>(ApiResponse.builder()
                .success(true)
                .message("Student enrolled successfully")
                .data(mapStudent(sp))
                .build(), HttpStatus.CREATED);
    }

    // 3. GET ALL BATCHES
    @GetMapping("/batches")
    public ResponseEntity<ApiResponse> getBatches(@AuthenticationPrincipal UserPrincipal principal) {
        UUID businessId = principal.getUser().getBusinessId();
        List<Batch> batchesList = batchRepository.findByBusinessId(businessId);
        List<Map<String, Object>> response = new ArrayList<>();

        for (Batch b : batchesList) {
            Course c = courseRepository.findById(b.getCourseId()).orElse(null);
            String courseName = c != null ? c.getName() : "Unknown Course";

            List<Map<String, Object>> activeStudents = studentProfileRepository.findActiveStudentsInBatch(b.getId())
                    .stream().map(this::mapStudent).collect(Collectors.toList());

            Map<String, Object> batchMap = new HashMap<>();
            batchMap.put("_id", b.getId());
            batchMap.put("id", b.getId());
            batchMap.put("name", b.getName());
            batchMap.put("courseName", courseName);
            batchMap.put("timings", b.getTimings());
            batchMap.put("students", activeStudents);
            response.add(batchMap);
        }

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Batches fetched successfully")
                .data(response)
                .build());
    }

    // 4. POST CREATE BATCH
    @PostMapping("/batches")
    @Transactional
    public ResponseEntity<ApiResponse> createBatch(@AuthenticationPrincipal UserPrincipal principal, @RequestBody Map<String, Object> body) {
        UUID businessId = principal.getUser().getBusinessId();
        String name = (String) body.get("name");
        String courseName = (String) body.get("courseName");
        String timings = (String) body.get("timings");
        List<String> students = (List<String>) body.get("students");

        if (name == null || courseName == null || timings == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please provide name, courseName, and timings");
        }

        UUID courseId = getOrCreateCourse(businessId, courseName);

        Batch batch = new Batch();
        batch.setCourseId(courseId);
        batch.setName(name);
        batch.setTimings(timings);
        batch = batchRepository.save(batch);

        if (students != null) {
            for (String sId : students) {
                UUID studentId = UUID.fromString(sId);
                Enrollment enrollment = new Enrollment();
                enrollment.setStudentId(studentId);
                enrollment.setBatchId(batch.getId());
                enrollment.setStatus("Active");
                enrollmentRepository.save(enrollment);
            }
        }

        List<Map<String, Object>> enrolledStudents = studentProfileRepository.findActiveStudentsInBatch(batch.getId())
                .stream().map(this::mapStudent).collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("_id", batch.getId());
        response.put("id", batch.getId());
        response.put("name", batch.getName());
        response.put("courseName", courseName);
        response.put("timings", batch.getTimings());
        response.put("students", enrolledStudents);

        return new ResponseEntity<>(ApiResponse.builder()
                .success(true)
                .message("Batch created successfully")
                .data(response)
                .build(), HttpStatus.CREATED);
    }

    // 5. POST ENROLL STUDENT IN BATCH
    @PostMapping("/batches/{id}/enroll")
    @Transactional
    public ResponseEntity<ApiResponse> enrollStudentInBatch(@AuthenticationPrincipal UserPrincipal principal, @PathVariable("id") UUID id, @RequestBody Map<String, Object> body) {
        UUID businessId = principal.getUser().getBusinessId();
        String sId = (String) body.get("studentId");
        if (sId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please provide studentId");
        }
        UUID studentId = UUID.fromString(sId);

        Batch batch = batchRepository.findByIdAndBusinessId(id, businessId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Batch not found"));

        StudentProfile sp = studentProfileRepository.findByIdAndBusinessId(studentId, businessId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found or unauthorized"));

        // check duplicates
        if (enrollmentRepository.findByStudentIdAndBatchId(studentId, batch.getId()).isEmpty()) {
            Enrollment enrollment = new Enrollment();
            enrollment.setStudentId(studentId);
            enrollment.setBatchId(batch.getId());
            enrollment.setStatus("Active");
            enrollmentRepository.save(enrollment);
        }

        Course c = courseRepository.findById(batch.getCourseId()).orElse(null);
        String courseName = c != null ? c.getName() : "Unknown Course";

        List<Map<String, Object>> enrolledStudents = studentProfileRepository.findActiveStudentsInBatch(batch.getId())
                .stream().map(this::mapStudent).collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("_id", batch.getId());
        response.put("id", batch.getId());
        response.put("name", batch.getName());
        response.put("courseName", courseName);
        response.put("timings", batch.getTimings());
        response.put("students", enrolledStudents);

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Student enrolled in batch successfully")
                .data(response)
                .build());
    }

    // 6. GET FEE INSTALLMENTS
    @GetMapping("/fees")
    public ResponseEntity<ApiResponse> getFees(@AuthenticationPrincipal UserPrincipal principal) {
        UUID businessId = principal.getUser().getBusinessId();
        List<FeeInstallment> list = feeInstallmentRepository.findByBusinessId(businessId);
        List<Map<String, Object>> response = new ArrayList<>();

        for (FeeInstallment f : list) {
            StudentProfile sp = studentProfileRepository.findById(f.getStudentId()).orElse(null);
            if (sp == null) continue;

            Map<String, Object> studentMap = new HashMap<>();
            studentMap.put("_id", sp.getId());
            studentMap.put("id", sp.getId());
            studentMap.put("studentName", sp.getStudentName());
            studentMap.put("parentPhone", sp.getParentPhone());
            studentMap.put("email", sp.getEmail());
            studentMap.put("admissionNumber", sp.getAdmissionNumber());

            Map<String, Object> feeMap = new HashMap<>();
            feeMap.put("_id", f.getId());
            feeMap.put("id", f.getId());
            feeMap.put("studentId", studentMap);
            feeMap.put("amount", f.getAmount());
            feeMap.put("dueDate", f.getDueDate());
            feeMap.put("status", f.getStatus());
            feeMap.put("razorpayPaymentLinkId", f.getRazorpayPaymentLinkId());
            feeMap.put("paidAt", f.getPaidAt());

            response.add(feeMap);
        }

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Fee installments fetched successfully")
                .data(response)
                .build());
    }

    // 7. POST CREATE FEE INSTALLMENT
    @PostMapping("/fees")
    @Transactional
    public ResponseEntity<ApiResponse> createFee(@AuthenticationPrincipal UserPrincipal principal, @RequestBody Map<String, Object> body) {
        UUID businessId = principal.getUser().getBusinessId();
        String sId = (String) body.get("studentId");
        Number amt = (Number) body.get("amount");
        String dueDateStr = (String) body.get("dueDate");
        String status = (String) body.get("status");

        if (sId == null || amt == null || dueDateStr == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please provide studentId, amount, and dueDate");
        }

        UUID studentId = UUID.fromString(sId);
        studentProfileRepository.findByIdAndBusinessId(studentId, businessId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found or unauthorized"));

        BigDecimal amount = BigDecimal.valueOf(amt.doubleValue());
        LocalDate dueDate = LocalDate.parse(dueDateStr);
        String linkId = "plink_" + UUID.randomUUID().toString().replaceAll("-", "").substring(0, 10);

        FeeInstallment fee = new FeeInstallment();
        fee.setStudentId(studentId);
        fee.setAmount(amount);
        fee.setDueDate(dueDate);
        fee.setStatus(status != null ? status : "Unpaid");
        fee.setRazorpayPaymentLinkId(linkId);

        fee = feeInstallmentRepository.save(fee);

        Map<String, Object> response = new HashMap<>();
        response.put("_id", fee.getId());
        response.put("id", fee.getId());
        response.put("studentId", sId);
        response.put("amount", fee.getAmount());
        response.put("dueDate", fee.getDueDate());
        response.put("status", fee.getStatus());
        response.put("razorpayPaymentLinkId", fee.getRazorpayPaymentLinkId());

        return new ResponseEntity<>(ApiResponse.builder()
                .success(true)
                .message("Fee installment created successfully")
                .data(response)
                .build(), HttpStatus.CREATED);
    }

    // 8. POST SEND MANUAL FEE REMINDER
    @PostMapping("/fees/{id}/remind")
    @Transactional
    public ResponseEntity<ApiResponse> remindFee(@AuthenticationPrincipal UserPrincipal principal, @PathVariable("id") UUID id) {
        UUID businessId = principal.getUser().getBusinessId();
        FeeInstallment fee = feeInstallmentRepository.findByIdAndBusinessId(id, businessId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fee installment not found"));

        StudentProfile sp = studentProfileRepository.findById(fee.getStudentId()).orElse(null);
        if (sp == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Student profile associated with this fee installment was not found.");
        }

        String link = "https://rzp.io/i/" + (fee.getRazorpayPaymentLinkId() != null ? fee.getRazorpayPaymentLinkId() : "mocklink");
        String message = "Dear Parent, this is a reminder from Coaching Academy that the fee installment of ₹" + fee.getAmount() + " for " + sp.getStudentName() + " is due. Please pay using this link: " + link;

        System.out.println("[WhatsApp Fee Reminder] To: " + sp.getParentPhone() + " | Message: " + message);

        logMessage(businessId, "System", sp.getParentPhone(), message, "WhatsApp", "Sent");

        Map<String, Object> response = new HashMap<>();
        response.put("phone", sp.getParentPhone());
        response.put("message", message);
        response.put("sentAt", ZonedDateTime.now());

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Fee reminder sent to parent's phone " + sp.getParentPhone() + " successfully!")
                .data(response)
                .build());
    }

    // 9. POST MARK ABSENT
    @PostMapping("/batches/{id}/absent")
    @Transactional
    public ResponseEntity<ApiResponse> markAbsent(@AuthenticationPrincipal UserPrincipal principal, @PathVariable("id") UUID id, @RequestBody Map<String, Object> body) {
        UUID businessId = principal.getUser().getBusinessId();
        String sId = (String) body.get("studentId");
        String date = (String) body.get("date");

        if (sId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please provide studentId");
        }
        UUID studentId = UUID.fromString(sId);

        Batch batch = batchRepository.findByIdAndBusinessId(id, businessId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Batch not found"));

        StudentProfile sp = studentProfileRepository.findByIdAndBusinessId(studentId, businessId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));

        Course c = courseRepository.findById(batch.getCourseId()).orElse(null);
        String courseName = c != null ? c.getName() : "Unknown";

        String dateStr = date != null ? date : LocalDate.now().toString();
        String message = "Dear Parent, this is to inform you that " + sp.getStudentName() + " was marked ABSENT for their class batch (" + batch.getName() + " - " + courseName + ") on " + dateStr + ".";

        System.out.println("[WhatsApp Absent Notification] To: " + sp.getParentPhone() + " | Message: " + message);

        logMessage(businessId, "System", sp.getParentPhone(), message, "WhatsApp", "Sent");

        Map<String, Object> response = new HashMap<>();
        response.put("phone", sp.getParentPhone());
        response.put("message", message);
        response.put("sentAt", ZonedDateTime.now());

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Absent alert sent to parent's phone " + sp.getParentPhone() + " successfully!")
                .data(response)
                .build());
    }

    // 10. GET ALL EXAMS
    @GetMapping("/exams")
    public ResponseEntity<ApiResponse> getExams(@AuthenticationPrincipal UserPrincipal principal) {
        UUID businessId = principal.getUser().getBusinessId();
        List<Exam> exams = examRepository.findByBusinessIdOrderByDateDesc(businessId);
        List<Map<String, Object>> response = new ArrayList<>();

        for (Exam e : exams) {
            Batch b = batchRepository.findById(e.getBatchId()).orElse(null);
            String batchName = b != null ? b.getName() : "Unknown Batch";

            Map<String, Object> batchMap = new HashMap<>();
            batchMap.put("_id", e.getBatchId());
            batchMap.put("id", e.getBatchId());
            batchMap.put("name", batchName);

            Map<String, Object> examMap = new HashMap<>();
            examMap.put("_id", e.getId());
            examMap.put("id", e.getId());
            examMap.put("batchId", batchMap);
            examMap.put("testName", e.getTestName());
            examMap.put("subject", e.getSubject());
            examMap.put("maxMarks", e.getMaxMarks());
            examMap.put("date", e.getDate());
            examMap.put("scores", parseScores(e.getScores()));

            response.add(examMap);
        }

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Exams fetched successfully")
                .data(response)
                .build());
    }

    // 11. POST RECORD EXAM
    @PostMapping("/exams")
    @Transactional
    public ResponseEntity<ApiResponse> createExam(@AuthenticationPrincipal UserPrincipal principal, @RequestBody Map<String, Object> body) {
        UUID businessId = principal.getUser().getBusinessId();
        String bId = (String) body.get("batchId");
        String testName = (String) body.get("testName");
        String subject = (String) body.get("subject");
        Number maxM = (Number) body.get("maxMarks");
        String dateStr = (String) body.get("date");
        List<Map<String, Object>> scores = (List<Map<String, Object>>) body.get("scores");

        if (bId == null || testName == null || subject == null || maxM == null || dateStr == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please provide batchId, testName, subject, maxMarks, and date");
        }

        UUID batchId = UUID.fromString(bId);
        LocalDate date = LocalDate.parse(dateStr);
        String scoresJson = stringifyScores(scores);

        Exam exam = new Exam();
        exam.setBusinessId(businessId);
        exam.setBatchId(batchId);
        exam.setTestName(testName);
        exam.setSubject(subject);
        exam.setMaxMarks(maxM.intValue());
        exam.setDate(date);
        exam.setScores(scoresJson);

        exam = examRepository.save(exam);

        Map<String, Object> response = new HashMap<>();
        response.put("_id", exam.getId());
        response.put("id", exam.getId());
        response.put("batchId", bId);
        response.put("testName", exam.getTestName());
        response.put("subject", exam.getSubject());
        response.put("maxMarks", exam.getMaxMarks());
        response.put("date", exam.getDate());
        response.put("scores", parseScores(exam.getScores()));

        return new ResponseEntity<>(ApiResponse.builder()
                .success(true)
                .message("Exam recorded successfully")
                .data(response)
                .build(), HttpStatus.CREATED);
    }

    // 12. POST PUBLISH EXAM REPORTS (Hinglish/English AI review)
    @PostMapping("/exams/{id}/publish")
    @Transactional
    public ResponseEntity<ApiResponse> publishExam(@AuthenticationPrincipal UserPrincipal principal, @PathVariable("id") UUID id) {
        UUID businessId = principal.getUser().getBusinessId();
        Exam exam = examRepository.findByIdAndBusinessId(id, businessId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exam record not found"));

        Batch b = batchRepository.findById(exam.getBatchId()).orElse(null);
        String batchName = b != null ? b.getName() : "Unknown Batch";

        List<Map<String, Object>> scores = parseScores(exam.getScores());
        List<Map<String, Object>> reports = new ArrayList<>();
        List<Map<String, Object>> updatedScores = new ArrayList<>();

        for (Map<String, Object> entry : scores) {
            String sId = (String) entry.get("studentId");
            if (sId == null) continue;
            UUID studentId = UUID.fromString(sId);

            StudentProfile student = studentProfileRepository.findByIdAndBusinessId(studentId, businessId).orElse(null);
            if (student == null) continue;

            Number marksObtained = (Number) entry.get("marksObtained");
            int marksVal = marksObtained != null ? marksObtained.intValue() : 0;
            int pct = (int) (((double) marksVal / exam.getMaxMarks()) * 100);

            String aiReview = "";
            if (llmService.isConfigured()) {
                String systemPrompt = "You are a helpful tutor writing a brief parent update review.";
                String userPrompt = "Student Name: " + student.getStudentName() + 
                                   ", Test: " + exam.getTestName() + 
                                   ", Subject: " + exam.getSubject() + 
                                   ", Marks: " + marksVal + "/" + exam.getMaxMarks() + " (" + pct + "%). " +
                                   "Write a concise, encouraging 1-2 sentence performance review in Hinglish/English for their parent. Highlight strengths or focus areas.";
                aiReview = llmService.callGroq(systemPrompt, userPrompt);
            }

            if (aiReview == null || aiReview.isEmpty()) {
                aiReview = student.getStudentName() + " scored " + marksVal + "/" + exam.getMaxMarks() + " (" + pct + "%). " +
                           (pct >= 75 ? "Excellent performance in class!" : "Needs to focus more on revision and practice.");
            }

            String message = "Dear Parent, here is the test report card of your ward " + student.getStudentName() + " for the test " + exam.getTestName() + " (" + exam.getSubject() + "):\n" +
                             "Marks: " + marksVal + "/" + exam.getMaxMarks() + " (" + pct + "%)\n" +
                             "Teacher Feedback: " + aiReview;

            System.out.println("[WhatsApp Exam Report] To: " + student.getParentPhone() + " | Message: " + message);

            logMessage(businessId, "System", student.getParentPhone(), message, "WhatsApp", "Sent");

            entry.put("remarks", aiReview);
            updatedScores.add(entry);

            Map<String, Object> rep = new HashMap<>();
            rep.put("studentName", student.getStudentName());
            rep.put("phone", student.getParentPhone());
            rep.put("message", message);
            rep.put("review", aiReview);
            reports.add(rep);
        }

        exam.setScores(stringifyScores(updatedScores));
        examRepository.save(exam);

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Test report cards dispatched successfully to all batch parents!")
                .data(reports)
                .build());
    }

    // 13. GET ALL LEADS
    @GetMapping("/leads")
    public ResponseEntity<ApiResponse> getLeads(@AuthenticationPrincipal UserPrincipal principal) {
        UUID businessId = principal.getUser().getBusinessId();
        List<Map<String, Object>> leads = leadRepository.findByBusinessIdOrderByCreatedAtDesc(businessId)
                .stream().map(this::mapLead).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Leads fetched successfully")
                .data(leads)
                .build());
    }

    // 14. POST CREATE LEAD
    @PostMapping("/leads")
    @Transactional
    public ResponseEntity<ApiResponse> createLead(@AuthenticationPrincipal UserPrincipal principal, @RequestBody Map<String, Object> body) {
        UUID businessId = principal.getUser().getBusinessId();
        String name = (String) body.get("name");
        String parentPhone = (String) body.get("parentPhone");
        String email = (String) body.get("email");
        String courseOfInterest = (String) body.get("courseOfInterest");
        String source = (String) body.get("source");
        String status = (String) body.get("status");
        String notes = (String) body.get("notes");

        if (name == null || parentPhone == null || courseOfInterest == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please provide name, parentPhone, and courseOfInterest");
        }

        Lead lead = new Lead();
        lead.setBusinessId(businessId);
        lead.setStudentName(name);
        lead.setPhone(parentPhone);
        lead.setEmail(email != null ? email : "");
        lead.setCourseOfInterest(courseOfInterest);
        lead.setSource(source != null ? source : "Website");
        lead.setStatus(status != null ? status : "New");
        lead.setNotes(notes != null ? notes : "");

        lead = leadRepository.save(lead);

        return new ResponseEntity<>(ApiResponse.builder()
                .success(true)
                .message("Lead registered successfully")
                .data(mapLead(lead))
                .build(), HttpStatus.CREATED);
    }

    // 15. POST SIMULATE AD WEBHOOK (Hinglish/English brochure auto-welcome)
    @PostMapping("/leads/simulate-inquiry")
    @Transactional
    public ResponseEntity<ApiResponse> simulateLeadInquiry(@AuthenticationPrincipal UserPrincipal principal) {
        UUID businessId = principal.getUser().getBusinessId();
        String[] firstNames = {"Amit", "Sunita", "Vikram", "Divya", "Preeti"};
        String[] lastNames = {"Sharma", "Verma", "Kumar", "Joshi", "Gupta"};
        String[] courses = {"10th Standard Science", "12th Standard Physics", "IIT-JEE Mathematics", "NEET Biology"};
        String[] sources = {"Google Business", "Facebook Ads", "Website"};

        int rIdx = ThreadLocalRandom.current().nextInt(firstNames.length);
        String name = firstNames[rIdx] + " " + lastNames[ThreadLocalRandom.current().nextInt(lastNames.length)];
        String parentPhone = "+91" + ThreadLocalRandom.current().nextLong(6000000000L, 9999999999L);
        String email = name.toLowerCase().replace(" ", ".") + "@example.com";
        String courseOfInterest = courses[ThreadLocalRandom.current().nextInt(courses.length)];
        String source = sources[ThreadLocalRandom.current().nextInt(sources.length)];

        Lead lead = new Lead();
        lead.setBusinessId(businessId);
        lead.setStudentName(name);
        lead.setPhone(parentPhone);
        lead.setEmail(email);
        lead.setCourseOfInterest(courseOfInterest);
        lead.setSource(source);
        lead.setStatus("New");
        lead.setNotes("Simulated inquiry incoming webhook.");
        lead = leadRepository.save(lead);

        String aiResponse = "";
        if (llmService.isConfigured()) {
            String systemPrompt = "You are an intake coordinator for Excellence Academy.";
            String userPrompt = "Draft a welcoming WhatsApp message in Hinglish/English for a parent named " + name + 
                               " who just inquired about \"" + courseOfInterest + "\" via " + source + ". " +
                               "Politely welcome them to Excellence Academy, mention class timings are standard evening slots, " +
                               "monthly fee is ₹1,500, and include a simulated digital brochure link: https://excellenceacademy.in/brochure.pdf.";
            aiResponse = llmService.callGroq(systemPrompt, userPrompt);
        }

        if (aiResponse == null || aiResponse.isEmpty()) {
            aiResponse = "Hello " + name + ", thank you for inquiring about our " + courseOfInterest + " classes at Excellence Academy! We offer high-quality batches (Mon-Wed-Fri 4-6 PM) at a monthly fee of ₹1,500. Here is our brochure: https://excellenceacademy.in/brochure.pdf. Let us know if you want to book a free demo class.";
        }

        System.out.println("[WhatsApp Lead Welcomer] To: " + parentPhone + " | Message: " + aiResponse);

        logMessage(businessId, "System", parentPhone, aiResponse, "WhatsApp", "Sent");

        Map<String, Object> data = new HashMap<>();
        data.put("lead", mapLead(lead));
        data.put("nurtureMessage", aiResponse);

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Simulated ad lead webhook triggered successfully! Nurture auto-reply dispatched to " + parentPhone)
                .data(data)
                .build());
    }

    // 16. GET DOUBTS LIST
    @GetMapping("/doubts")
    public ResponseEntity<ApiResponse> getDoubts(@AuthenticationPrincipal UserPrincipal principal) {
        UUID businessId = principal.getUser().getBusinessId();
        List<Map<String, Object>> doubts = doubtRepository.findByBusinessIdOrderByCreatedAtDesc(businessId)
                .stream().map(this::mapDoubt).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Doubts fetched successfully")
                .data(doubts)
                .build());
    }

    // 17. POST ACADEMIC DOUBT SOLVING (AI Tutor Doubt Solver)
    @PostMapping("/doubts")
    @Transactional
    public ResponseEntity<ApiResponse> submitDoubt(@AuthenticationPrincipal UserPrincipal principal, @RequestBody Map<String, Object> body) {
        UUID businessId = principal.getUser().getBusinessId();
        String studentName = (String) body.get("studentName");
        String question = (String) body.get("question");

        if (studentName == null || question == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please provide studentName and question");
        }

        String aiResponse = "";
        if (llmService.isConfigured()) {
            String systemPrompt = "You are Excellence Academy's WhatsApp AI Doubt Solver.";
            String userPrompt = "Provide a clear, friendly, and step-by-step educational solution to this student doubt: \"" + question + "\". " +
                               "Break down mathematical steps or scientific concepts clearly. Keep it under 200 words.";
            aiResponse = llmService.callGroq(systemPrompt, userPrompt);
        }

        if (aiResponse == null || aiResponse.isEmpty()) {
            aiResponse = "Thanks for asking! Here is the explanation for: \"" + question + "\". Speed is a scalar quantity (only magnitude), while Velocity is a vector quantity (contains both speed and direction). For example, 50 km/h is speed, but 50 km/h North is velocity.";
        }

        Doubt doubt = new Doubt();
        doubt.setBusinessId(businessId);
        doubt.setStudentName(studentName);
        doubt.setQuestion(question);
        doubt.setAiResponse(aiResponse);
        doubt = doubtRepository.save(doubt);

        return new ResponseEntity<>(ApiResponse.builder()
                .success(true)
                .message("Doubt solved successfully by AI Tutor")
                .data(mapDoubt(doubt))
                .build(), HttpStatus.CREATED);
    }

    // 18. POST RESCHEDULE BATCH
    @PostMapping("/batches/{id}/reschedule")
    @Transactional
    public ResponseEntity<ApiResponse> rescheduleBatch(@AuthenticationPrincipal UserPrincipal principal, @PathVariable("id") UUID id, @RequestBody Map<String, Object> body) {
        UUID businessId = principal.getUser().getBusinessId();
        String newTimings = (String) body.get("newTimings");
        String reason = (String) body.get("reason");

        if (newTimings == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please provide newTimings");
        }

        Batch batch = batchRepository.findByIdAndBusinessId(id, businessId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Batch not found"));

        String oldTimings = batch.getTimings();
        batch.setTimings(newTimings);
        batchRepository.save(batch);

        Course c = courseRepository.findById(batch.getCourseId()).orElse(null);
        String courseName = c != null ? c.getName() : "Unknown Course";

        List<StudentProfile> enrolled = studentProfileRepository.findActiveStudentsInBatch(batch.getId());
        List<Map<String, Object>> notifications = new ArrayList<>();

        for (StudentProfile student : enrolled) {
            String message = "Dear Parent, please note that the class timings for batch \"" + batch.getName() + "\" (" + courseName + ") " +
                             "have been rescheduled from \"" + oldTimings + "\" to \"" + newTimings + "\" due to " + 
                             (reason != null ? reason : "unforeseen teacher scheduling updates") + ". Sorry for the inconvenience!";

            System.out.println("[WhatsApp Broadcast Reschedule] To: " + student.getParentPhone() + " | Message: " + message);

            logMessage(businessId, "System", student.getParentPhone(), message, "WhatsApp", "Sent");

            Map<String, Object> notif = new HashMap<>();
            notif.put("studentName", student.getStudentName());
            notif.put("phone", student.getParentPhone());
            notif.put("message", message);
            notifications.add(notif);
        }

        Map<String, Object> batchInfo = new HashMap<>();
        batchInfo.put("_id", batch.getId());
        batchInfo.put("id", batch.getId());
        batchInfo.put("name", batch.getName());
        batchInfo.put("courseName", courseName);
        batchInfo.put("timings", batch.getTimings());

        Map<String, Object> response = new HashMap<>();
        response.put("batch", batchInfo);
        response.put("notifications", notifications);

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Batch rescheduled. Emergency alerts sent to " + enrolled.size() + " parents!")
                .data(response)
                .build());
    }

    // 19. POST SEED DEMO DATA
    @PostMapping("/seed")
    @Transactional
    public ResponseEntity<ApiResponse> seed(@AuthenticationPrincipal UserPrincipal principal) {
        UUID businessId = principal.getUser().getBusinessId();

        // Check if database already has students for this tenant
        if (!studentProfileRepository.findByBusinessIdOrderByCreatedAtDesc(businessId).isEmpty()) {
            return ResponseEntity.ok(ApiResponse.builder()
                    .success(true)
                    .message("Database already contains data, skipping seed.")
                    .data(Map.of("seeded", false))
                    .build());
        }

        // 1. Create Students
        StudentProfile s1 = new StudentProfile();
        s1.setBusinessId(businessId);
        s1.setStudentName("Aarav Mehta");
        s1.setParentName("Rajesh Mehta");
        s1.setParentPhone("+919876543210");
        s1.setEmail("aarav.mehta@example.com");
        s1.setAdmissionNumber("ADM-2026-001");
        s1.setJoinedDate(LocalDate.parse("2026-01-10"));
        s1 = studentProfileRepository.save(s1);

        StudentProfile s2 = new StudentProfile();
        s2.setBusinessId(businessId);
        s2.setStudentName("Ishita Patel");
        s2.setParentName("Vikram Patel");
        s2.setParentPhone("+919123456789");
        s2.setEmail("ishita.patel@example.com");
        s2.setAdmissionNumber("ADM-2026-002");
        s2.setJoinedDate(LocalDate.parse("2026-01-12"));
        s2 = studentProfileRepository.save(s2);

        StudentProfile s3 = new StudentProfile();
        s3.setBusinessId(businessId);
        s3.setStudentName("Rohan Das");
        s3.setParentName("Amit Das");
        s3.setParentPhone("+919988776655");
        s3.setEmail("rohan.das@example.com");
        s3.setAdmissionNumber("ADM-2026-003");
        s3.setJoinedDate(LocalDate.parse("2026-02-05"));
        s3 = studentProfileRepository.save(s3);

        StudentProfile s4 = new StudentProfile();
        s4.setBusinessId(businessId);
        s4.setStudentName("Sneha Kapoor");
        s4.setParentName("Sanjay Kapoor");
        s4.setParentPhone("+919876123456");
        s4.setEmail("sneha.kapoor@example.com");
        s4.setAdmissionNumber("ADM-2026-004");
        s4.setJoinedDate(LocalDate.parse("2026-02-15"));
        s4 = studentProfileRepository.save(s4);

        // 2. Create Courses
        UUID mathCourseId = getOrCreateCourse(businessId, "Mathematics");
        UUID physCourseId = getOrCreateCourse(businessId, "Physics");

        // 3. Create Batches
        Batch b1 = new Batch();
        b1.setCourseId(mathCourseId);
        b1.setName("Class 10 - Mathematics");
        b1.setTimings("Mon-Wed-Fri 4PM - 6PM");
        b1 = batchRepository.save(b1);

        Batch b2 = new Batch();
        b2.setCourseId(physCourseId);
        b2.setName("Class 12 - Physics");
        b2.setTimings("Tue-Thu-Sat 5PM - 7PM");
        b2 = batchRepository.save(b2);

        // 4. Enrollments
        Enrollment e1 = new Enrollment(null, s1.getId(), b1.getId(), "Active", null);
        enrollmentRepository.save(e1);
        Enrollment e2 = new Enrollment(null, s2.getId(), b1.getId(), "Active", null);
        enrollmentRepository.save(e2);
        Enrollment e3 = new Enrollment(null, s3.getId(), b1.getId(), "Active", null);
        enrollmentRepository.save(e3);
        Enrollment e4 = new Enrollment(null, s2.getId(), b2.getId(), "Active", null);
        enrollmentRepository.save(e4);
        Enrollment e5 = new Enrollment(null, s4.getId(), b2.getId(), "Suspended", null);
        enrollmentRepository.save(e5);

        // 5. Fee Installments
        FeeInstallment f1 = new FeeInstallment();
        f1.setStudentId(s1.getId());
        f1.setAmount(BigDecimal.valueOf(1500));
        f1.setDueDate(LocalDate.parse("2026-04-01"));
        f1.setStatus("Paid");
        f1.setRazorpayPaymentLinkId("plink_paid123456");
        f1.setPaidAt(ZonedDateTime.now());
        feeInstallmentRepository.save(f1);

        FeeInstallment f2 = new FeeInstallment();
        f2.setStudentId(s2.getId());
        f2.setAmount(BigDecimal.valueOf(2000));
        f2.setDueDate(LocalDate.parse("2026-06-15"));
        f2.setStatus("Unpaid");
        f2.setRazorpayPaymentLinkId("plink_unpaid" + UUID.randomUUID().toString().replaceAll("-", "").substring(0, 5));
        feeInstallmentRepository.save(f2);

        FeeInstallment f3 = new FeeInstallment();
        f3.setStudentId(s3.getId());
        f3.setAmount(BigDecimal.valueOf(1500));
        f3.setDueDate(LocalDate.parse("2026-05-01"));
        f3.setStatus("Unpaid");
        f3.setRazorpayPaymentLinkId("plink_overdue" + UUID.randomUUID().toString().replaceAll("-", "").substring(0, 5));
        feeInstallmentRepository.save(f3);

        // 6. Exams
        List<Map<String, Object>> examScores = List.of(
            Map.of("studentId", s1.getId().toString(), "marksObtained", 46, "remarks", "Excellent math logic demonstrated!"),
            Map.of("studentId", s2.getId().toString(), "marksObtained", 38, "remarks", "Very good algebraic solving steps."),
            Map.of("studentId", s3.getId().toString(), "marksObtained", 25, "remarks", "Needs revision in linear equations.")
        );
        Exam exam = new Exam();
        exam.setBusinessId(businessId);
        exam.setBatchId(b1.getId());
        exam.setTestName("Algebra Test-1");
        exam.setSubject("Mathematics");
        exam.setMaxMarks(50);
        exam.setDate(LocalDate.parse("2026-05-15"));
        exam.setScores(stringifyScores(examScores));
        examRepository.save(exam);

        // 7. Leads
        Lead l1 = new Lead();
        l1.setBusinessId(businessId);
        l1.setStudentName("Vikrant Singh");
        l1.setPhone("+919812345678");
        l1.setEmail("vikrant.singh@example.com");
        l1.setCourseOfInterest("12th Standard Physics");
        l1.setSource("Facebook Ads");
        l1.setStatus("New");
        l1.setNotes("Parent wants evening classes schedule.");
        leadRepository.save(l1);

        Lead l2 = new Lead();
        l2.setBusinessId(businessId);
        l2.setStudentName("Neha Patil");
        l2.setPhone("+919004455667");
        l2.setEmail("neha.patil@example.com");
        l2.setCourseOfInterest("10th Standard Science");
        l2.setSource("Google Business");
        l2.setStatus("Demo Scheduled");
        l2.setNotes("Demo class booked for this Saturday.");
        leadRepository.save(l2);

        Lead l3 = new Lead();
        l3.setBusinessId(businessId);
        l3.setStudentName("Aman Verma");
        l3.setPhone("+918877665544");
        l3.setEmail("aman.verma@example.com");
        l3.setCourseOfInterest("IIT-JEE Mathematics");
        l3.setSource("Website");
        l3.setStatus("Contacted");
        l3.setNotes("Enquired about installment payment options.");
        leadRepository.save(l3);

        // 8. Doubts
        Doubt d1 = new Doubt();
        d1.setBusinessId(businessId);
        d1.setStudentName("Aarav Mehta");
        d1.setQuestion("What is the formula for the volume of a sphere?");
        d1.setAiResponse("The formula for the volume of a sphere is V = (4/3) * π * r³, where r is the radius of the sphere. For example, if radius is 3cm, volume is 36π cm³ (~113.1 cm³).");
        doubtRepository.save(d1);

        Doubt d2 = new Doubt();
        d2.setBusinessId(businessId);
        d2.setStudentName("Ishita Patel");
        d2.setQuestion("What is the difference between an element and a compound?");
        d2.setAiResponse("An element consists of only one type of atom (e.g. pure Gold). A compound is made of different elements chemically bonded (e.g. Water H2O).");
        doubtRepository.save(d2);

        return new ResponseEntity<>(ApiResponse.builder()
                .success(true)
                .message("Demo students, batches, fee records, exams, leads, and doubts seeded successfully!")
                .data(Map.of("seeded", true))
                .build(), HttpStatus.CREATED);
    }
}
