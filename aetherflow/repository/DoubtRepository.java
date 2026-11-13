package com.aetherflow.repository;

import com.aetherflow.model.Doubt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DoubtRepository extends JpaRepository<Doubt, UUID> {
    List<Doubt> findByBusinessIdOrderByCreatedAtDesc(UUID businessId);
}
