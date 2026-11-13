package com.aetherflow.repository;

import com.aetherflow.model.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID> {
    List<Enrollment> findByBatchId(UUID batchId);
    Optional<Enrollment> findByStudentIdAndBatchId(UUID studentId, UUID batchId);
}
