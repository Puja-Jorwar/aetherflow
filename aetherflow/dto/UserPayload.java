package com.aetherflow.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.UUID;

public class UserPayload {
    @JsonProperty("_id")
    private String mongoId;

    private UUID id;

    @JsonProperty("business_id")
    private UUID businessId;

    private String name;
    private String email;
    private String role;

    public UserPayload() {}

    public UserPayload(String mongoId, UUID id, UUID businessId, String name, String email, String role) {
        this.mongoId = mongoId;
        this.id = id;
        this.businessId = businessId;
        this.name = name;
        this.email = email;
        this.role = role;
    }

    public String getMongoId() {
        return this.mongoId;
    }

    public void setMongoId(String mongoId) {
        this.mongoId = mongoId;
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

    public String getName() {
        return this.name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return this.email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return this.role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public static UserPayloadBuilder builder() {
        return new UserPayloadBuilder();
    }

    public static class UserPayloadBuilder {
        private String mongoId;
        private UUID id;
        private UUID businessId;
        private String name;
        private String email;
        private String role;

        public UserPayloadBuilder mongoId(String mongoId) {
            this.mongoId = mongoId;
            return this;
        }

        public UserPayloadBuilder id(UUID id) {
            this.id = id;
            return this;
        }

        public UserPayloadBuilder businessId(UUID businessId) {
            this.businessId = businessId;
            return this;
        }

        public UserPayloadBuilder name(String name) {
            this.name = name;
            return this;
        }

        public UserPayloadBuilder email(String email) {
            this.email = email;
            return this;
        }

        public UserPayloadBuilder role(String role) {
            this.role = role;
            return this;
        }

        public UserPayload build() {
            return new UserPayload(
                this.mongoId,
                this.id,
                this.businessId,
                this.name,
                this.email,
                this.role
            );
        }
    }

}