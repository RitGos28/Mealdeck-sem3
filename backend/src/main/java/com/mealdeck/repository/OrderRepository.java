package com.mealdeck.repository;

import com.mealdeck.model.Order;
import java.time.LocalDate;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<Order, Long> {

    // Fetch join so OrderDto.from() can read items/menuItem/stall outside the
    // transaction without a LazyInitializationException (open-in-view is off,
    // same reasoning as StallRepository.findAllWithMenuItems).
    @Query("select distinct o from Order o "
            + "left join fetch o.items i left join fetch i.menuItem "
            + "where o.stall.id = :stallId and o.pickupDate = :date "
            + "order by o.pickupTime, o.createdAt")
    List<Order> findByStallIdAndPickupDateWithItems(@Param("stallId") Long stallId, @Param("date") LocalDate date);

    /** One bulk UPDATE rather than load-and-save, so an order the vendor
     * marks picked up in the same instant can't be overwritten: the
     * `status = READY` check and the write happen in one statement. */
    @Modifying(clearAutomatically = true)
    @Query("update Order o set o.status = com.mealdeck.model.OrderStatus.NO_SHOW "
            + "where o.status = com.mealdeck.model.OrderStatus.READY and o.readyAt < :cutoff")
    int markUncollectedAsNoShow(@Param("cutoff") Instant cutoff);

    @Query("select distinct o from Order o "
            + "left join fetch o.items i left join fetch i.menuItem "
            + "left join fetch o.stall order by o.createdAt desc")
    List<Order> findAllWithItems();

    @Query("select o from Order o "
            + "left join fetch o.items i left join fetch i.menuItem "
            + "left join fetch o.stall where o.id = :id")
    Optional<Order> findByIdWithItems(@Param("id") Long id);
}
