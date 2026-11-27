package com.mealdeck.repository;

import com.mealdeck.model.DishVote;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DishVoteRepository extends JpaRepository<DishVote, Long> {

    Optional<DishVote> findByStudentIdAndMenuItemId(Long studentId, Long menuItemId);

    List<DishVote> findByStudentId(Long studentId);

    /** Per dish: [menuItemId, amazing votes, not-worth-it votes]. */
    @Query("select v.menuItem.id, sum(case when v.amazing = true then 1 else 0 end), "
            + "sum(case when v.amazing = false then 1 else 0 end) from DishVote v group by v.menuItem.id")
    List<Object[]> countsPerDish();

    /** Per dish, votes cast or changed since then: [menuItemId, stallId, amazing, not worth it]. */
    @Query("select v.menuItem.id, v.menuItem.stall.id, sum(case when v.amazing = true then 1 else 0 end), "
            + "sum(case when v.amazing = false then 1 else 0 end) from DishVote v where v.createdAt >= :since "
            + "group by v.menuItem.id, v.menuItem.stall.id")
    List<Object[]> countsPerDishSince(@Param("since") java.time.Instant since);

    @Modifying
    @Query("delete from DishVote v where v.student.id = :studentId")
    int deleteByStudentId(@Param("studentId") Long studentId);

    @Modifying
    @Query("delete from DishVote v where v.menuItem.id = :menuItemId")
    int deleteByMenuItemId(@Param("menuItemId") Long menuItemId);
}
