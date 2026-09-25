package com.mealdeck.repository;

import com.mealdeck.model.Order;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long> {

    // Fetch join so OrderDto.from() can read items/menuItem/stall outside the
    // transaction without a LazyInitializationException (open-in-view is off,
    // same reasoning as StallRepository.findAllWithMenuItems).
    @Query("select distinct o from Order o "
            + "left join fetch o.items i left join fetch i.menuItem "
            + "where o.stall.id = :stallId order by o.createdAt desc")
    List<Order> findByStallIdWithItems(@Param("stallId") Long stallId);

    @Query("select distinct o from Order o "
            + "left join fetch o.items i left join fetch i.menuItem "
            + "left join fetch o.stall order by o.createdAt desc")
    List<Order> findAllWithItems();

    @Query("select o from Order o "
            + "left join fetch o.items i left join fetch i.menuItem "
            + "left join fetch o.stall where o.id = :id")
    Optional<Order> findByIdWithItems(@Param("id") Long id);
}
