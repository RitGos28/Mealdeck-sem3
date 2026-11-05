package com.mealdeck.repository;

import com.mealdeck.model.ActivityLog;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    /** Newest first; the page size caps how much comes back. */
    List<ActivityLog> findAllByOrderByIdDesc(Pageable page);

    List<ActivityLog> findByStudentIdOrderByIdDesc(Long studentId, Pageable page);

    @Modifying
    @Query("delete from ActivityLog a where a.createdAt < :cutoff")
    int deleteOlderThan(@Param("cutoff") Instant cutoff);
}
