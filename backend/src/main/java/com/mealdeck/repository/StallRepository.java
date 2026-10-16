package com.mealdeck.repository;

import com.mealdeck.model.Stall;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
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

    /** Row lock held until the checkout transaction ends, so two students
     * racing for a slot's last spot are counted one after the other. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Stall s where s.id = :id")
    Optional<Stall> findByIdForUpdate(@Param("id") Long id);
}
