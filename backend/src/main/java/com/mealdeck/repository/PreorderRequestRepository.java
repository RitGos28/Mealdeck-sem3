package com.mealdeck.repository;

import com.mealdeck.model.PreorderRequest;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface PreorderRequestRepository extends JpaRepository<PreorderRequest, Long> {

    boolean existsByStallIdAndStudentId(Long stallId, Long studentId);

    List<PreorderRequest> findByStudentId(Long studentId);

    /** Rows of [stallId, count, latest request time]. */
    @Query("select r.stallId, count(r), max(r.createdAt) from PreorderRequest r group by r.stallId")
    List<Object[]> countsByStall();

    // Derived deletes, deliberately without @Modifying(clearAutomatically).
    void deleteByStallIdAndStudentId(Long stallId, Long studentId);

    void deleteByStudentId(Long studentId);

    void deleteByStallId(Long stallId);
}
