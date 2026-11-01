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

    long countByStallId(Long stallId);

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

    /** Before deleting a student account: their orders stay on the vendor's
     * history (items, prices, times) so the stall's records still add up,
     * but anonymised: the name and contact copied at checkout are wiped. */
    @Modifying(clearAutomatically = true)
    @Query("update Order o set o.student = null, o.customerName = 'Deleted student', o.customerContact = '(deleted)' where o.student.id = :studentId")
    void detachStudent(@Param("studentId") Long studentId);

    /** Pickup days of no-shows for this email code since `since`, newest first. */
    @Query("select o.pickupDate from Order o where o.customerEmailKey = :key and o.status = com.mealdeck.model.OrderStatus.NO_SHOW and o.pickupDate >= :since order by o.pickupDate desc")
    List<LocalDate> noShowDates(@Param("key") String key, @Param("since") LocalDate since);

    /** Email codes with at least `limit` no-shows since `since`: [key, count, latest pickup day]. */
    @Query("select o.customerEmailKey, count(o), max(o.pickupDate) from Order o where o.customerEmailKey is not null and o.status = com.mealdeck.model.OrderStatus.NO_SHOW and o.pickupDate >= :since group by o.customerEmailKey having count(o) >= :limit")
    List<Object[]> repeatNoShows(@Param("since") LocalDate since, @Param("limit") long limit);

    /** Retention: drop email codes from orders older than the no-show window. */
    @Modifying
    @Query("update Order o set o.customerEmailKey = null where o.customerEmailKey is not null and o.pickupDate < :before")
    int forgetEmailKeysBefore(@Param("before") LocalDate before);

    /** Whether the student has an order a stall is still working on. */
    boolean existsByStudentIdAndStatusIn(Long studentId, java.util.Collection<com.mealdeck.model.OrderStatus> statuses);

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

    @Query("select o from Order o "
            + "left join fetch o.items i left join fetch i.menuItem "
            + "left join fetch o.stall where o.publicCode = :code")
    Optional<Order> findByPublicCodeWithItems(@Param("code") String code);

    List<Order> findByPublicCodeIsNull();

    /** A student's "My orders": newest first. */
    @Query("select distinct o from Order o "
            + "left join fetch o.items i left join fetch i.menuItem "
            + "left join fetch o.stall where o.student.id = :studentId order by o.createdAt desc")
    List<Order> findByStudentIdWithItems(@Param("studentId") Long studentId);
}
