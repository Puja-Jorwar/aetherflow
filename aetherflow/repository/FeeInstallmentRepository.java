package com.aetherflow.repository;

import com.aetherflow.model.FeeInstallment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FeeInstallmentRepository extends JpaRepository<FeeInstallment, UUID> {
    
    @Query("SELECT f FROM FeeInstallment f JOIN StudentProfile sp ON f.studentId = sp.id WHERE sp.businessId = :businessId ORDER BY f.dueDate ASC")
    List<FeeInstallment> findByBusinessId(@Param("businessId") UUID businessId);

    @Query("SELECT f FROM FeeInstallment f JOIN StudentProfile sp ON f.studentId = sp.id WHERE f.id = :feeId AND sp.businessId = :businessId")
    Optional<FeeInstallment> findByIdAndBusinessId(@Param("feeId") UUID feeId, @Param("businessId") UUID businessId);
}
