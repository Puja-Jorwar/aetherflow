package com.aetherflow;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;

@SpringBootApplication
public class AetherflowApplication {
    public static void main(String[] args) {
        // Load .env variables from current or parent directory
        try {
            File currentDir = new File(System.getProperty("user.dir"));
            File envFile = new File(currentDir, ".env");
            
            if (!envFile.exists()) {
                File parentDir = currentDir.getParentFile();
                if (parentDir != null) {
                    envFile = new File(parentDir, ".env");
                }
            }
            
            Dotenv dotenv;
            if (envFile.exists()) {
                dotenv = Dotenv.configure().directory(envFile.getParent()).load();
                System.out.println("🌱 Environment variables loaded successfully from " + envFile.getAbsolutePath());
            } else {
                dotenv = Dotenv.configure().ignoreIfMissing().load();
                System.out.println("⚠️ Warning: .env file not found. Using default environment/system variables.");
            }
            
            dotenv.entries().forEach(entry -> {
                System.setProperty(entry.getKey(), entry.getValue());
            });
        } catch (Exception e) {
            System.err.println("⚠️ Warning: Could not find or load .env: " + e.getMessage());
        }
        
        SpringApplication.run(AetherflowApplication.class, args);
    }
}
