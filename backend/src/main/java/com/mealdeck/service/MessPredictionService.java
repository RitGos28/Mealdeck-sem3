package com.mealdeck.service;

import com.mealdeck.model.MessMeal;
import com.mealdeck.model.MessMeal.Meal;
import com.mealdeck.repository.MessMealRepository;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** "Probably: rajma, jeera rice, roti": a guess at a meal nobody has added
 * today, learned from the same weekday in past weeks (the mess menu runs on
 * a weekly rotation; MyCamu itself labels meals "Lunch(Wed)").
 *
 * Each past week votes for the dishes it served, recent weeks counting more
 * (weight DECAY^weeksAgo-1); a dish is predicted when it has at least half of
 * the vote. Needs at least MIN_WEEKS weeks of that meal on that weekday. It
 * is only ever shown as a guess, never stored as the menu: a student still
 * adds (or corrects) the real one. */
@Service
public class MessPredictionService {

    static final int WEEKS = 6;
    static final int MIN_WEEKS = 2;
    static final double DECAY = 0.8;
    static final double MIN_SHARE = 0.5;

    private final MessMealRepository meals;
    private final MessService messService;

    public MessPredictionService(MessMealRepository meals, MessService messService) {
        this.meals = meals;
        this.messService = messService;
    }

    /** dishes: the guess, most consistent first. weeksSeen: past weeks that
     * had this meal on this weekday, out of weeksLooked. */
    public record Prediction(Meal meal, List<String> dishes, int weeksSeen, int weeksLooked) {
    }

    /** A guess for each of today's meals that nobody has added yet. */
    @Transactional(readOnly = true)
    public List<Prediction> today() {
        LocalDate today = messService.today();
        List<Prediction> out = new ArrayList<>();
        for (Meal meal : Meal.values()) {
            if (meals.findByDateAndMeal(today, meal).isPresent()) continue;
            predict(today, meal).ifPresent(out::add);
        }
        return out;
    }

    Optional<Prediction> predict(LocalDate date, Meal meal) {
        // dish (lower case) -> [display name, vote]
        Map<String, Object[]> votes = new LinkedHashMap<>();
        double total = 0;
        int seen = 0;
        for (int weeksAgo = 1; weeksAgo <= WEEKS; weeksAgo++) {
            Optional<MessMeal> past = meals.findByDateAndMeal(date.minusWeeks(weeksAgo), meal);
            if (past.isEmpty()) continue;
            seen++;
            double weight = Math.pow(DECAY, weeksAgo - 1);
            total += weight;
            for (String dish : past.get().getDishes()) {
                Object[] entry = votes.computeIfAbsent(dish.toLowerCase(Locale.ROOT).trim(), k -> new Object[] {dish, 0.0});
                entry[1] = (double) entry[1] + weight;
            }
        }
        if (seen < MIN_WEEKS) return Optional.empty();
        double all = total;
        List<String> dishes = votes.values().stream()
                .filter(e -> (double) e[1] / all >= MIN_SHARE)
                .sorted((a, b) -> Double.compare((double) b[1], (double) a[1]))
                .map(e -> (String) e[0])
                .toList();
        return dishes.isEmpty() ? Optional.empty() : Optional.of(new Prediction(meal, dishes, seen, WEEKS));
    }
}
