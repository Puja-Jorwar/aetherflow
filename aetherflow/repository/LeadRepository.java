package com.aetherflow.repository;

import com.aetherflow.model.Lead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LeadRepository extends JpaRepository<Lead, UUID> {
    List<Lead> findByBusinessIdOrderByCreatedAtDesc(UUID businessId);
    Optional<Lead> findByIdAndBusinessId(UUID id, UUID businessId);
    Optional<Lead> findByBusinessIdAndPhone(UUID businessId, String phone);
}
