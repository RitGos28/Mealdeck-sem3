package com.mealdeck.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.mealdeck.FixedClockConfig;
import com.mealdeck.model.MessMeal;
import com.mealdeck.model.MessMeal.Meal;
import com.mealdeck.repository.MessMealRepository;
import com.mealdeck.service.MessPredictionService.Prediction;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/** Clock pinned to Tuesday 2026-09-29: past Tuesdays are the training data. */
@SpringBootTest
@ActiveProfiles("demo")
@Import(FixedClockConfig.class)
@Transactional
class MessPredictionTests {

    @Autowired MessPredictionService predictions;
    @Autowired MessService mess;
    @Autowired MessMealRepository meals;

    private void served(int weeksAgo, Meal meal, String... dishes) {
        LocalDate day = mess.today().minusWeeks(weeksAgo);
        meals.save(new MessMeal(day, meal, List.of(dishes), null, FixedClockConfig.NOW.minusSeconds(weeksAgo * 7L * 86400)));
    }

    private Prediction lunch() {
        return predictions.today().stream().filter(p -> p.meal() == Meal.LUNCH).findFirst().orElse(null);
    }

    @Test
    void guessesWhatTheSameWeekdayUsuallyServes() {
        served(1, Meal.LUNCH, "Rajma", "Jeera Rice", "Roti", "Salad");
        served(2, Meal.LUNCH, "Rajma", "Jeera Rice", "Roti", "Boondi Raita");
        served(3, Meal.LUNCH, "Rajma", "jeera rice", "Roti");
        // A Monday's lunch says nothing about Tuesday's.
        meals.save(new MessMeal(mess.today().minusDays(1), Meal.LUNCH, List.of("Chole"), null, FixedClockConfig.NOW));

        Prediction guess = lunch();

        assertThat(guess).isNotNull();
        assertThat(guess.dishes()).containsExactlyInAnyOrder("Rajma", "Jeera Rice", "Roti");
        assertThat(guess.weeksSeen()).isEqualTo(3);
    }

    @Test
    void oneWeekIsNotEnoughToGuess() {
        served(1, Meal.LUNCH, "Rajma", "Jeera Rice");

        assertThat(lunch()).isNull();
    }

    @Test
    void recentWeeksCountMoreWhenTheMenuChanged() {
        // The rotation changed two weeks ago: kadhi replaced rajma.
        served(1, Meal.LUNCH, "Kadhi Pakora", "Rice");
        served(2, Meal.LUNCH, "Kadhi Pakora", "Rice");
        served(3, Meal.LUNCH, "Rajma", "Rice");
        served(4, Meal.LUNCH, "Rajma", "Rice");

        assertThat(lunch().dishes()).contains("Kadhi Pakora", "Rice").doesNotContain("Rajma");
    }

    @Test
    void noGuessOnceSomeoneHasAddedTodaysMeal() {
        served(1, Meal.LUNCH, "Rajma");
        served(2, Meal.LUNCH, "Rajma");
        meals.save(new MessMeal(mess.today(), Meal.LUNCH, List.of("Rajma"), null, FixedClockConfig.NOW));

        assertThat(lunch()).isNull();
    }
}
