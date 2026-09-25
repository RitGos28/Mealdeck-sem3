package com.mealdeck.repository;

import com.mealdeck.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    // Atomic bulk update instead of read-modify-write, so two concurrent reports
    // can't clobber each other's increment — same UPDATE ... SET report_count =
    // report_count + 1 pattern mealdeck_improved uses. clearAutomatically drops
    // the persistence-context cache so a following findById re-reads the fresh
    // value instead of returning the stale in-memory one.
    @Modifying(clearAutomatically = true)
    @Query("update MenuItem m set m.reportCount = m.reportCount + 1 where m.id = :id")
    void incrementReportCount(@Param("id") Long id);

    // Daily reset: every item comes back in stock overnight and starts the
    // day with a clean vote count.
    @Modifying(clearAutomatically = true)
    @Query("update MenuItem m set m.available = true, m.reportCount = 0")
    void resetAllAvailability();
}
