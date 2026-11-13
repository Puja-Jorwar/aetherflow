package com.aetherflow.model;

import org.hibernate.annotations.CreationTimestamp;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "exams")
public class Exam {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "business_id", nullable = false)
    private UUID businessId;

    @Column(name = "batch_id", nullable = false)
    private UUID batchId;

    @Column(name = "test_name", nullable = false)
    private String testName;

    @Column(nullable = false)
    private String subject;

    @Column(name = "max_marks", nullable = false)
    private Integer maxMarks;

    @Column(nullable = false)
    private LocalDate date;

    // Map JSONB column as String
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private String scores = "[]";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    public Exam() {}

    public Exam(UUID id, UUID businessId, UUID batchId, String testName, String subject, Integer maxMarks, LocalDate date, String scores, ZonedDateTime createdAt) {
        this.id = id;
        this.businessId = businessId;
        this.batchId = batchId;
        this.testName = testName;
        this.subject = subject;
        this.maxMarks = maxMarks;
        this.date = date;
        this.scores = scores;
        this.createdAt = createdAt;
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

    public UUID getBatchId() {
        return this.batchId;
    }

    public void setBatchId(UUID batchId) {
        this.batchId = batchId;
    }

    public String getTestName() {
        return this.testName;
    }

    public void setTestName(String testName) {
        this.testName = testName;
    }

    public String getSubject() {
        return this.subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public Integer getMaxMarks() {
        return this.maxMarks;
    }

    public void setMaxMarks(Integer maxMarks) {
        this.maxMarks = maxMarks;
    }

    public LocalDate getDate() {
        return this.date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getScores() {
        return this.scores;
    }

    public void setScores(String scores) {
        this.scores = scores;
    }

    public ZonedDateTime getCreatedAt() {
        return this.createdAt;
    }

    public void setCreatedAt(ZonedDateTime createdAt) {
        this.createdAt = createdAt;
    }

}