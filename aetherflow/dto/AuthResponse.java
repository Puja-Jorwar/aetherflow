package com.aetherflow.dto;

public class AuthResponse {
    private UserPayload user;
    private String token;

    public AuthResponse() {}

    public AuthResponse(UserPayload user, String token) {
        this.user = user;
        this.token = token;
    }

    public UserPayload getUser() {
        return this.user;
    }

    public void setUser(UserPayload user) {
        this.user = user;
    }

    public String getToken() {
        return this.token;
    }

    public void setToken(String token) {
        this.token = token;
    }

}