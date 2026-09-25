package com.mealdeck.repository;

import com.mealdeck.model.Report;
import java.time.Instant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {

    boolean existsByMenuItemIdAndStudentIdAndCreatedAtAfter(Long menuItemId, Long studentId, Instant cutoff);

    void deleteByMenuItemId(Long menuItemId);
}
