package com.aetherflow.repository;

import com.aetherflow.model.Prompt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PromptRepository extends JpaRepository<Prompt, UUID> {
    List<Prompt> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<Prompt> findByIdAndUserId(UUID id, UUID userId);
    long countByUserId(UUID userId);
}
