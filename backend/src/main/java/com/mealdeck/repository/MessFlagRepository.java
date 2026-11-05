package com.mealdeck.repository;

import com.mealdeck.model.MessFlag;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MessFlagRepository extends JpaRepository<MessFlag, Long> {

    boolean existsByMealIdAndStudentId(Long mealId, Long studentId);

    List<MessFlag> findByMealIdOrderByIdAsc(Long mealId);

    /** Meals the student has flagged among these. */
    @Query("select f.mealId from MessFlag f where f.studentId = :studentId and f.mealId in :mealIds")
    List<Long> flaggedMealIds(@Param("studentId") Long studentId, @Param("mealIds") java.util.Collection<Long> mealIds);

    // Derived deletes: no @Modifying(clearAutomatically), which would clear the
    // persistence context before the pending removals are flushed.
    void deleteByMealId(Long mealId);

    void deleteByStudentId(Long studentId);

    /** Flags only matter on their own day. */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from MessFlag f where f.mealId in (select m.id from MessMeal m where m.date < :today)")
    int deleteForMealsBefore(@Param("today") LocalDate today);
}
