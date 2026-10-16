package com.mealdeck.repository;

import com.mealdeck.model.Order;
import java.time.LocalDate;
import java.time.Instant;
import java.time.LocalTime;
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

    /** Orders that take up a place in a slot: everything but CANCELLED. A
     * NO_SHOW still used the kitchen's time, so it keeps its place. */
    @Query("select count(o) from Order o where o.stall.id = :stallId and o.pickupDate = :date "
            + "and o.pickupTime = :time and o.status <> com.mealdeck.model.OrderStatus.CANCELLED")
    long countActiveInSlot(@Param("stallId") Long stallId, @Param("date") LocalDate date, @Param("time") LocalTime time);

    /** Same count as countActiveInSlot, for every slot of the day at once:
     * rows of [pickupTime, count]. */
    @Query("select o.pickupTime, count(o) from Order o where o.stall.id = :stallId and o.pickupDate = :date "
            + "and o.status <> com.mealdeck.model.OrderStatus.CANCELLED group by o.pickupTime")
    List<Object[]> countActiveBySlot(@Param("stallId") Long stallId, @Param("date") LocalDate date);

    @Query("select distinct o.stall.id from Order o where o.pickupDate = :date")
    List<Long> findStallIdsWithOrdersOn(@Param("date") LocalDate date);

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
