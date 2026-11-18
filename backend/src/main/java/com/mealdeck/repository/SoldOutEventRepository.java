package com.mealdeck.repository;

import com.mealdeck.model.SoldOutEvent;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SoldOutEventRepository extends JpaRepository<SoldOutEvent, Long> {

    @Query("select e from SoldOutEvent e join fetch e.menuItem where e.occurredAt >= :since order by e.occurredAt")
    List<SoldOutEvent> findSince(@Param("since") Instant since);

    @Modifying
    @Query("delete from SoldOutEvent e where e.menuItem.id = :menuItemId")
    int deleteByMenuItemId(@Param("menuItemId") Long menuItemId);
}
