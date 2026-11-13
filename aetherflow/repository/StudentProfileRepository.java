package com.aetherflow.repository;

import com.aetherflow.model.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentProfileRepository extends JpaRepository<StudentProfile, UUID> {
    List<StudentProfile> findByBusinessIdOrderByCreatedAtDesc(UUID businessId);
    Optional<StudentProfile> findByIdAndBusinessId(UUID id, UUID businessId);
    Optional<StudentProfile> findByBusinessIdAndAdmissionNumber(UUID businessId, String admissionNumber);

    @Query("SELECT sp FROM StudentProfile sp JOIN Enrollment e ON sp.id = e.studentId WHERE e.batchId = :batchId AND e.status = 'Active'")
    List<StudentProfile> findActiveStudentsInBatch(@Param("batchId") UUID batchId);
}
