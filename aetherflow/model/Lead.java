package com.aetherflow.model;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "leads")
public class Lead {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "business_id", nullable = false)
    private UUID businessId;

    @Column(name = "student_name", nullable = false)
    private String studentName;

    @Column(name = "parent_name")
    private String parentName;

    @Column(nullable = false)
    private String phone;

    private String email;

    private String source = "WhatsApp";

    private String status = "Inquiry"; // Inquiry, Demo Scheduled, Demo Attended, Admitted, Lost

    private Integer score = 0;

    private String sentiment = "Neutral";

    @Column(name = "course_of_interest")
    private String courseOfInterest;

    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;

    public Lead() {}

    public Lead(UUID id, UUID businessId, String studentName, String parentName, String phone, String email, String source, String status, Integer score, String sentiment, String courseOfInterest, String notes, ZonedDateTime createdAt, ZonedDateTime updatedAt) {
        this.id = id;
        this.businessId = businessId;
        this.studentName = studentName;
        this.parentName = parentName;
        this.phone = phone;
        this.email = email;
        this.source = source;
        this.status = status;
        this.score = score;
        this.sentiment = sentiment;
        this.courseOfInterest = courseOfInterest;
        this.notes = notes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() {
        return this.id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getBusinessId() {
        return this.businessId;
    }

    public void setBusinessId(UUID businessId) {
        this.businessId = businessId;
    }

    public String getStudentName() {
        return this.studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getParentName() {
        return this.parentName;
    }

    public void setParentName(String parentName) {
        this.parentName = parentName;
    }

    public String getPhone() {
        return this.phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return this.email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSource() {
        return this.source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getStatus() {
        return this.status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getScore() {
        return this.score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public String getSentiment() {
        return this.sentiment;
    }

    public void setSentiment(String sentiment) {
        this.sentiment = sentiment;
    }

    public String getCourseOfInterest() {
        return this.courseOfInterest;
    }

    public void setCourseOfInterest(String courseOfInterest) {
        this.courseOfInterest = courseOfInterest;
    }

    public String getNotes() {
        return this.notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public ZonedDateTime getCreatedAt() {
        return this.createdAt;
    }

    public void setCreatedAt(ZonedDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public ZonedDateTime getUpdatedAt() {
        return this.updatedAt;
    }

    public void setUpdatedAt(ZonedDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

}