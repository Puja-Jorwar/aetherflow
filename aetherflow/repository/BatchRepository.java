package com.aetherflow.repository;

import com.aetherflow.model.Batch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BatchRepository extends JpaRepository<Batch, UUID> {
    
    @Query("SELECT b FROM Batch b JOIN Course c ON b.courseId = c.id WHERE c.businessId = :businessId ORDER BY b.createdAt DESC")
    List<Batch> findByBusinessId(@Param("businessId") UUID businessId);

    @Query("SELECT b FROM Batch b JOIN Course c ON b.courseId = c.id WHERE b.id = :batchId AND c.businessId = :businessId")
    Optional<Batch> findByIdAndBusinessId(@Param("batchId") UUID batchId, @Param("businessId") UUID businessId);
}
