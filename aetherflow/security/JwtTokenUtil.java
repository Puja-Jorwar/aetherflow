package com.aetherflow.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

@Component
public class JwtTokenUtil {

    private String getSecret() {
        String secret = System.getProperty("JWT_SECRET");
        if (secret == null || secret.isEmpty()) {
            secret = System.getenv("JWT_SECRET");
        }
        if (secret == null || secret.isEmpty()) {
            secret = "fallback-secret-key-123-fallback-secret-key-123"; // JJWT requires at least 256 bits (32 chars) for HS256
        }
        // Ensure the secret is at least 32 characters long
        if (secret.length() < 32) {
            secret = secret + "00000000000000000000000000000000".substring(secret.length());
        }
        return secret;
    }

    private Key getSigningKey() {
        byte[] keyBytes = getSecret().getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String extractUserId(String token) {
        return extractClaim(token, claims -> claims.get("id", String.class));
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public String generateToken(UUID userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("id", userId.toString());
        return createToken(claims);
    }

    private String createToken(Map<String, Object> claims) {
        long expirationMs = 7 * 24 * 60 * 60 * 1000L; // default 7 days
        String expiresInEnv = System.getProperty("JWT_EXPIRES_IN");
        if (expiresInEnv == null || expiresInEnv.isEmpty()) {
            expiresInEnv = System.getenv("JWT_EXPIRES_IN");
        }
        if (expiresInEnv != null && !expiresInEnv.isEmpty()) {
            try {
                if (expiresInEnv.endsWith("d")) {
                    int days = Integer.parseInt(expiresInEnv.substring(0, expiresInEnv.length() - 1));
                    expirationMs = (long) days * 24 * 60 * 60 * 1000L;
                } else if (expiresInEnv.endsWith("h")) {
                    int hours = Integer.parseInt(expiresInEnv.substring(0, expiresInEnv.length() - 1));
                    expirationMs = (long) hours * 60 * 60 * 1000L;
                }
            } catch (Exception e) {
                // Keep default
            }
        }

        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Boolean validateToken(String token, UUID userId) {
        final String extractedId = extractUserId(token);
        return (extractedId.equals(userId.toString()) && !isTokenExpired(token));
    }
}
