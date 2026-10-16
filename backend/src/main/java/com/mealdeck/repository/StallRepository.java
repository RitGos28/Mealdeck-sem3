package com.mealdeck.repository;

import com.mealdeck.model.Stall;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StallRepository extends JpaRepository<Stall, Long> {

    // Explicit fetch join: menuItems is lazy and open-in-view is off, so
    // StallDto.from() building each item list outside the transaction would
    // otherwise hit a LazyInitializationException.
    @Query("select distinct s from Stall s left join fetch s.menuItems order by s.name")
    List<Stall> findAllWithMenuItems();

    @Query("select s from Stall s left join fetch s.menuItems where s.id = :id")
    Optional<Stall> findByIdWithMenuItems(@Param("id") Long id);

    /** Lifts every stall's "pause orders" at the daily reset. "Closed today"
     * is deliberately left alone: it stays until the vendor or an admin
     * turns it off. flushAutomatically: the reset runs this after
     * deleteAll() on reports, which only queues its deletes; clearing the
     * persistence context without flushing first would silently drop them. */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update Stall s set s.ordersPaused = false")
    void unpauseAll();

    /** Row lock held until the checkout transaction ends, so two students
     * racing for a slot's last spot are counted one after the other. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Stall s where s.id = :id")
    Optional<Stall> findByIdForUpdate(@Param("id") Long id);
}
