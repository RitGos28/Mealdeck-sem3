package com.mealdeck.repository;

import com.mealdeck.model.Stall;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
