package com.aetherflow.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DataSourceConfig {

    @Bean
    public DataSource dataSource() {
        String dbUrlEnv = System.getProperty("DATABASE_URL");
        if (dbUrlEnv == null || dbUrlEnv.isEmpty()) {
            dbUrlEnv = System.getenv("DATABASE_URL");
        }

        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setDriverClassName("org.postgresql.Driver");

        if (dbUrlEnv != null && !dbUrlEnv.isEmpty()) {
            try {
                System.out.println("🔌 Connecting using DATABASE_URL environment string...");
                // Handle formats: postgres://username:password@host:port/database
                URI dbUri = new URI(dbUrlEnv);
                
                String username = dbUri.getUserInfo().split(":")[0];
                String password = dbUri.getUserInfo().split(":")[1];
                String dbUrl = "jdbc:postgresql://" + dbUri.getHost() + ":" + dbUri.getPort() + dbUri.getPath();

                dataSource.setUrl(dbUrl);
                dataSource.setUsername(username);
                dataSource.setPassword(password);
            } catch (Exception e) {
                System.err.println("❌ Error parsing DATABASE_URL, falling back to localhost defaults: " + e.getMessage());
                fallbackUrl(dataSource);
            }
        } else {
            fallbackUrl(dataSource);
        }

        return dataSource;
    }

    private void fallbackUrl(DriverManagerDataSource dataSource) {
        System.out.println("🔌 DATABASE_URL not found. Connecting using local default database...");
        dataSource.setUrl("jdbc:postgresql://localhost:5432/classflow_db");
        dataSource.setUsername("postgres");
        dataSource.setPassword("root");
    }
}
