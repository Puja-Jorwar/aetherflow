package com.aetherflow.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseInitializer implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        try {
            System.out.println("🛠️ Running database initialization schema setup...");
            // Create uuid-ossp extension if not exists
            jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"");
            
            // Create messages table if not exists (which is used by JdbcTemplate)
            jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS messages (" +
                "  id UUID PRIMARY KEY DEFAULT uuid_generate_v4()," +
                "  business_id UUID," +
                "  sender_type VARCHAR(50)," +
                "  recipient_phone VARCHAR(50)," +
                "  content TEXT," +
                "  platform VARCHAR(50)," +
                "  status VARCHAR(50)," +
                "  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP" +
                ")"
            );
            System.out.println("✅ Messages table checked/created successfully!");
        } catch (Exception e) {
            System.err.println("⚠️ Warning during database schema initialization: " + e.getMessage());
        }
    }
}
