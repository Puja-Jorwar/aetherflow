package com.aetherflow.model;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "businesses")
public class Business {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String subdomain;

    private String address;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "ai_credits")
    private Integer aiCredits = 500;

    @Column(name = "subscription_plan")
    private String subscriptionPlan = "Starter";

    @Column(name = "subscription_status")
    private String subscriptionStatus = "active";

    @Column(name = "razorpay_subscription_id")
    private String razorpaySubscriptionId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;

    public Business() {}

    public Business(UUID id, String name, String subdomain, String address, String logoUrl, Integer aiCredits, String subscriptionPlan, String subscriptionStatus, String razorpaySubscriptionId, ZonedDateTime createdAt, ZonedDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.subdomain = subdomain;
        this.address = address;
        this.logoUrl = logoUrl;
        this.aiCredits = aiCredits;
        this.subscriptionPlan = subscriptionPlan;
        this.subscriptionStatus = subscriptionStatus;
        this.razorpaySubscriptionId = razorpaySubscriptionId;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() {
        return this.id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return this.name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSubdomain() {
        return this.subdomain;
    }

    public void setSubdomain(String subdomain) {
        this.subdomain = subdomain;
    }

    public String getAddress() {
        return this.address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getLogoUrl() {
        return this.logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public Integer getAiCredits() {
        return this.aiCredits;
    }

    public void setAiCredits(Integer aiCredits) {
        this.aiCredits = aiCredits;
    }

    public String getSubscriptionPlan() {
        return this.subscriptionPlan;
    }

    public void setSubscriptionPlan(String subscriptionPlan) {
        this.subscriptionPlan = subscriptionPlan;
    }

    public String getSubscriptionStatus() {
        return this.subscriptionStatus;
    }

    public void setSubscriptionStatus(String subscriptionStatus) {
        this.subscriptionStatus = subscriptionStatus;
    }

    public String getRazorpaySubscriptionId() {
        return this.razorpaySubscriptionId;
    }

    public void setRazorpaySubscriptionId(String razorpaySubscriptionId) {
        this.razorpaySubscriptionId = razorpaySubscriptionId;
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