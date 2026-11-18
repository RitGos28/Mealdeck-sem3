package com.mealdeck.repository;

import com.mealdeck.model.MessMeal;
import com.mealdeck.model.MessMeal.Meal;
import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MessMealRepository extends JpaRepository<MessMeal, Long> {

    List<MessMeal> findByDate(LocalDate date);

    Optional<MessMeal> findByDateAndMeal(LocalDate date, Meal meal);

    /** Row lock until commit, so two flags are counted one after the other. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select m from MessMeal m where m.date = :date and m.meal = :meal")
    Optional<MessMeal> findForUpdate(@Param("date") LocalDate date, @Param("meal") Meal meal);

    /** A deleted student's menus stay, anonymously. */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update MessMeal m set m.submittedByStudentId = null where m.submittedByStudentId = :studentId")
    void clearSubmitter(@Param("studentId") Long studentId);
}
