package com.mealdeck.repository;

import com.mealdeck.model.DealSwipe;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DealSwipeRepository extends JpaRepository<DealSwipe, Long> {

    /** Every swipe, oldest first, with the dish and its stall: replayed to
     * rebuild the shared model. */
    @Query("select s from DealSwipe s join fetch s.menuItem m join fetch m.stall order by s.id")
    List<DealSwipe> findAllForTraining();

    @Query("select s from DealSwipe s join fetch s.menuItem m join fetch m.stall where s.student.id = :studentId order by s.id")
    List<DealSwipe> findByStudentForTraining(@Param("studentId") Long studentId);

    long countByStudentId(Long studentId);

    /** Per dish, Deal keeps since then: [menuItemId, stallId, keeps]. */
    @Query("select s.menuItem.id, s.menuItem.stall.id, count(s) from DealSwipe s "
            + "where s.kept = true and s.createdAt >= :since group by s.menuItem.id, s.menuItem.stall.id")
    List<Object[]> keepsPerDishSince(@Param("since") java.time.Instant since);

    @Modifying
    @Query("delete from DealSwipe s where s.student.id = :studentId")
    int deleteByStudentId(@Param("studentId") Long studentId);

    @Modifying
    @Query("delete from DealSwipe s where s.menuItem.id = :menuItemId")
    int deleteByMenuItemId(@Param("menuItemId") Long menuItemId);
}
