package com.aetherflow.repository;

import com.aetherflow.model.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExamRepository extends JpaRepository<Exam, UUID> {
    List<Exam> findByBusinessIdOrderByDateDesc(UUID businessId);
    Optional<Exam> findByIdAndBusinessId(UUID id, UUID businessId);
}
