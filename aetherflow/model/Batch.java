package com.aetherflow.model;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "batches")
public class Batch {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "course_id", nullable = false)
    private UUID courseId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String timings;

    @Column(name = "class_teacher_id")
    private UUID classTeacherId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;

    public Batch() {}

    public Batch(UUID id, UUID courseId, String name, String timings, UUID classTeacherId, ZonedDateTime createdAt, ZonedDateTime updatedAt) {
        this.id = id;
        this.courseId = courseId;
        this.name = name;
        this.timings = timings;
        this.classTeacherId = classTeacherId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() {
        return this.id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getCourseId() {
        return this.courseId;
    }

    public void setCourseId(UUID courseId) {
        this.courseId = courseId;
    }

    public String getName() {
        return this.name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTimings() {
        return this.timings;
    }

    public void setTimings(String timings) {
        this.timings = timings;
    }

    public UUID getClassTeacherId() {
        return this.classTeacherId;
    }

    public void setClassTeacherId(UUID classTeacherId) {
        this.classTeacherId = classTeacherId;
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