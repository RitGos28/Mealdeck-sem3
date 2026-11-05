package com.mealdeck.service;

import com.mealdeck.model.MessFlag;
import com.mealdeck.model.MessMeal;
import com.mealdeck.model.MessMeal.Meal;
import com.mealdeck.model.MessPrice;
import com.mealdeck.repository.MessFlagRepository;
import com.mealdeck.repository.MessMealRepository;
import com.mealdeck.repository.MessPriceRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * The campus mess's daily menu, written by students (hostellers see it in
 * MyCamu; day scholars can't). The first menu added for a meal stands; three
 * different students flagging it replace it with the most common correction
 * (ties go to the earliest flag); an admin can confirm a menu, which locks
 * it. Menus are keyed by date, so "reset every morning" is just asking for
 * today, and history stays.
 */
@Service
public class MessService {

    private static final Logger log = LoggerFactory.getLogger(MessService.class);
    private static final java.time.ZoneId CAMPUS = java.time.ZoneId.of("Asia/Kolkata");

    public static final int FLAGS_TO_REPLACE = 3;
    public static final int MAX_DISHES = 25;
    public static final int MAX_DISH_LENGTH = 60;

    /** One meal as shown to students. addedByStudent is only filled for admins. */
    public record MealView(Meal meal, String label, List<String> items, Instant addedAt, Integer priceInr,
                           boolean confirmed, boolean locked, boolean youAdded, boolean youFlagged, Long addedByStudent) {
    }

    private final MessMealRepository meals;
    private final MessFlagRepository flags;
    private final MessPriceRepository prices;
    private final ActivityLogService activityLog;
    private final Clock clock;

    public MessService(MessMealRepository meals, MessFlagRepository flags, MessPriceRepository prices, ActivityLogService activityLog, Clock clock) {
        this.meals = meals;
        this.flags = flags;
        this.prices = prices;
        this.activityLog = activityLog;
        this.clock = clock;
    }

    public LocalDate today() {
        return LocalDate.now(clock);
    }

    /** Today's four meals in order; a meal nobody has added has no items.
     * studentId (or null) fills in "you added this" and "you flagged this". */
    @Transactional(readOnly = true)
    public List<MealView> today(Long studentId, boolean forAdmin) {
        return viewsFor(today(), studentId, forAdmin);
    }

    @Transactional(readOnly = true)
    public List<MealView> forDate(LocalDate date) {
        return viewsFor(date, null, true);
    }

    private List<MealView> viewsFor(LocalDate date, Long studentId, boolean forAdmin) {
        Map<Meal, MessMeal> byMeal = new LinkedHashMap<>();
        for (MessMeal meal : meals.findByDate(date)) byMeal.put(meal.getMeal(), meal);
        Set<Long> flagged = Set.of();
        if (studentId != null && !byMeal.isEmpty()) {
            flagged = new java.util.HashSet<>(flags.flaggedMealIds(studentId, byMeal.values().stream().map(MessMeal::getId).toList()));
        }
        Map<Meal, Integer> priceByMeal = new LinkedHashMap<>();
        for (MessPrice price : prices.findAll()) priceByMeal.put(price.getMeal(), price.getPriceInr());
        List<MealView> views = new ArrayList<>();
        for (Meal meal : Meal.values()) {
            MessMeal row = byMeal.get(meal);
            Integer price = priceByMeal.get(meal);
            if (row == null) {
                views.add(new MealView(meal, meal.label(), List.of(), null, price, false, false, false, false, null));
            } else {
                views.add(new MealView(meal, meal.label(), row.getDishes(), row.getCreatedAt(), price,
                        row.getConfirmedAt() != null, row.isLocked(),
                        studentId != null && studentId.equals(row.getSubmittedByStudentId()),
                        flagged.contains(row.getId()), forAdmin ? row.getSubmittedByStudentId() : null));
            }
        }
        return views;
    }

    /** A student adds today's menu for a meal nobody has added yet. */
    @Transactional
    public void add(Long studentId, Meal meal, String text) {
        List<String> dishes = parseDishes(text);
        if (meals.findByDateAndMeal(today(), meal).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Today's " + meal.label().toLowerCase(Locale.ROOT) + " menu is already added. If it's wrong, tap \"This isn't correct\".");
        }
        try {
            meals.saveAndFlush(new MessMeal(today(), meal, dishes, studentId, clock.instant()));
        } catch (DataIntegrityViolationException e) {
            // Someone added it a moment ago: the first one stands.
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Someone just added today's " + meal.label().toLowerCase(Locale.ROOT) + " menu. If it's wrong, tap \"This isn't correct\".");
        }
        activityLog.messMealAdded(studentId, meal.label());
    }

    /** A student says today's menu is wrong and what it really is. Three
     * different students replace it with the most common correction. */
    @Transactional
    public void flag(Long studentId, Meal meal, String correction) {
        List<String> dishes = parseDishes(correction);
        MessMeal row = meals.findForUpdate(today(), meal)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nobody has added today's " + meal.label().toLowerCase(Locale.ROOT) + " menu yet"));
        if (row.isLocked()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An admin has checked this menu, so it can't be changed here.");
        }
        if (studentId.equals(row.getSubmittedByStudentId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You added this menu, so you can't flag it.");
        }
        if (flags.existsByMealIdAndStudentId(row.getId(), studentId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already said this menu isn't correct.");
        }
        flags.saveAndFlush(new MessFlag(row.getId(), studentId, String.join("\n", dishes), clock.instant()));
        activityLog.messFlagged(studentId, meal.label());

        List<MessFlag> all = flags.findByMealIdOrderByIdAsc(row.getId());
        if (all.size() >= FLAGS_TO_REPLACE) {
            replaceWithMostCommon(row, all);
        }
    }

    /** Most common correction (by its normalised dishes); a tie goes to the
     * group whose first flag came first. Its first flag's wording is used. */
    private void replaceWithMostCommon(MessMeal row, List<MessFlag> all) {
        Map<String, List<MessFlag>> groups = new LinkedHashMap<>();
        for (MessFlag flag : all) {
            groups.computeIfAbsent(key(Arrays.asList(flag.getCorrection().split("\n"))), k -> new ArrayList<>()).add(flag);
        }
        List<MessFlag> winner = null;
        for (List<MessFlag> group : groups.values()) {
            if (winner == null || group.size() > winner.size()) winner = group; // groups are in first-flag order, so ties keep the earlier
        }
        row.setDishes(Arrays.asList(winner.getFirst().getCorrection().split("\n")));
        row.setSubmittedByStudentId(null);
        row.setCreatedAt(clock.instant());
        meals.save(row);
        flags.deleteByMealId(row.getId());
        activityLog.messMenuCorrected(row.getMeal().label());
    }

    // ---- admin ----

    /** An admin sets a meal's dishes (creating it if absent). The lock stays
     * as it was; flags against the old text are dropped. */
    @Transactional
    public void adminSet(LocalDate date, Meal meal, String text) {
        List<String> dishes = parseDishes(text);
        MessMeal row = meals.findForUpdate(date, meal).orElse(null);
        if (row == null) {
            meals.save(new MessMeal(date, meal, dishes, null, clock.instant()));
            return;
        }
        row.setDishes(dishes);
        row.setSubmittedByStudentId(null);
        row.setCreatedAt(clock.instant());
        meals.save(row);
        flags.deleteByMealId(row.getId());
    }

    @Transactional
    public void confirm(LocalDate date, Meal meal) {
        MessMeal row = existing(date, meal);
        row.confirm(clock.instant());
        meals.save(row);
        flags.deleteByMealId(row.getId());
        activityLog.messMenuConfirmed(meal.label());
    }

    @Transactional
    public void unlock(LocalDate date, Meal meal) {
        MessMeal row = existing(date, meal);
        row.unlock();
        meals.save(row);
    }

    @Transactional
    public void delete(LocalDate date, Meal meal) {
        MessMeal row = existing(date, meal);
        flags.deleteByMealId(row.getId());
        meals.delete(row);
    }

    /** null clears the price ("Price at the counter"). */
    @Transactional
    public void setPrice(Meal meal, Integer priceInr) {
        if (priceInr != null && (priceInr < 0 || priceInr > 2000)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Price must be between 0 and 2000");
        }
        MessPrice price = prices.findById(meal).orElseGet(() -> new MessPrice(meal, null));
        price.setPriceInr(priceInr);
        prices.save(price);
    }

    private MessMeal existing(LocalDate date, Meal meal) {
        return meals.findForUpdate(date, meal)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No " + meal.label().toLowerCase(Locale.ROOT) + " menu for " + date));
    }

    /** Nightly: flags only matter on their own day. */
    @Scheduled(cron = "0 50 3 * * *", zone = "Asia/Kolkata")
    @Transactional
    public int purgeOldFlags() {
        int removed = flags.deleteForMealsBefore(LocalDate.now(clock.withZone(CAMPUS)));
        if (removed > 0) log.info("Mess: removed {} flags from earlier days", removed);
        return removed;
    }

    // ---- parsing ----

    /** "Rajma, jeera rice\naloo gobi" to a clean list: trimmed, spaces
     * collapsed, no blanks, no repeats. Refuses empty lists, links and
     * anything over the limits. */
    public static List<String> parseDishes(String text) {
        if (text == null || text.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "List at least one dish");
        }
        String lower = text.toLowerCase(Locale.ROOT);
        if (lower.contains("http") || lower.contains("www.")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Just the dishes, no links");
        }
        Set<String> seen = new LinkedHashSet<>();
        List<String> dishes = new ArrayList<>();
        for (String part : text.split("[,\\n;]")) {
            String dish = part.replaceAll("\\p{Cntrl}", " ").trim().replaceAll("\\s+", " ");
            if (dish.isEmpty() || !seen.add(dish.toLowerCase(Locale.ROOT))) continue;
            if (dish.length() > MAX_DISH_LENGTH) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Each dish can be at most " + MAX_DISH_LENGTH + " characters");
            }
            dishes.add(dish);
        }
        if (dishes.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "List at least one dish");
        }
        if (dishes.size() > MAX_DISHES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At most " + MAX_DISHES + " dishes per meal");
        }
        return dishes;
    }

    /** Two corrections are "the same" if they list the same dishes, whatever the order or case. */
    static String key(List<String> dishes) {
        return dishes.stream().map(d -> d.toLowerCase(Locale.ROOT)).sorted().collect(java.util.stream.Collectors.joining("|"));
    }
}
