package com.aetherflow.repository;

import com.aetherflow.model.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatRepository extends JpaRepository<Chat, UUID> {
    List<Chat> findByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<Chat> findByIdAndUserId(UUID id, UUID userId);
    long countByUserId(UUID userId);
}
