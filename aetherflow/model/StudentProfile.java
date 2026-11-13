package com.aetherflow.model;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "student_profiles")
public class StudentProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "business_id", nullable = false)
    private UUID businessId;

    @Column(name = "lead_id")
    private UUID leadId;

    @Column(name = "student_name", nullable = false)
    private String studentName;

    @Column(name = "parent_name")
    private String parentName;

    @Column(name = "parent_phone", nullable = false)
    private String parentPhone;

    private String email;

    @Column(name = "admission_number", unique = true)
    private String admissionNumber;

    @Column(name = "joined_date")
    private LocalDate joinedDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;

    public StudentProfile() {}

    public StudentProfile(UUID id, UUID businessId, UUID leadId, String studentName, String parentName, String parentPhone, String email, String admissionNumber, LocalDate joinedDate, ZonedDateTime createdAt, ZonedDateTime updatedAt) {
        this.id = id;
        this.businessId = businessId;
        this.leadId = leadId;
        this.studentName = studentName;
        this.parentName = parentName;
        this.parentPhone = parentPhone;
        this.email = email;
        this.admissionNumber = admissionNumber;
        this.joinedDate = joinedDate;
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

    public UUID getLeadId() {
        return this.leadId;
    }

    public void setLeadId(UUID leadId) {
        this.leadId = leadId;
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

    public String getParentPhone() {
        return this.parentPhone;
    }

    public void setParentPhone(String parentPhone) {
        this.parentPhone = parentPhone;
    }

    public String getEmail() {
        return this.email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAdmissionNumber() {
        return this.admissionNumber;
    }

    public void setAdmissionNumber(String admissionNumber) {
        this.admissionNumber = admissionNumber;
    }

    public LocalDate getJoinedDate() {
        return this.joinedDate;
    }

    public void setJoinedDate(LocalDate joinedDate) {
        this.joinedDate = joinedDate;
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