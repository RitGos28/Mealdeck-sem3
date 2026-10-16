package com.mealdeck.repository;

import com.mealdeck.model.Report;
import java.time.Instant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReportRepository extends JpaRepository<Report, Long> {

    boolean existsByMenuItemIdAndStudentIdAndCreatedAtAfter(Long menuItemId, Long studentId, Instant cutoff);

    /** How many different students have an open vote on this item. Votes
     * are deleted on restock and at the daily reset, so this is "since the
     * item was last known to be in stock". */
    @Query("select count(distinct r.student.id) from Report r where r.menuItem.id = :menuItemId")
    long countDistinctStudentsByMenuItemId(@Param("menuItemId") Long menuItemId);

    void deleteByMenuItemId(Long menuItemId);

    void deleteByStudentId(Long studentId);
}
