package com.mealdeck.repository;

import com.mealdeck.model.Stall;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface StallRepository extends JpaRepository<Stall, Long> {

    // Explicit fetch join: menuItems is lazy and open-in-view is off, so the
    // Thymeleaf template rendering after the request would otherwise hit a
    // LazyInitializationException.
    @Query("select distinct s from Stall s left join fetch s.menuItems order by s.name")
    List<Stall> findAllWithMenuItems();
}
