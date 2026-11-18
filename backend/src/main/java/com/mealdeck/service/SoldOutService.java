package com.mealdeck.service;

import com.mealdeck.model.SoldOutEvent;
import com.mealdeck.repository.SoldOutEventRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** "Often sold out by 2 PM": learned from the last four weeks of sold-out
 * events (students' reports and stalls unticking a dish). For each dish it
 * takes the first time it ran out on each day, and reports the median of
 * those times (rounded to the quarter hour) and on how many days it ran out.
 *
 * Damping: the estimate is pulled towards the dish's stall-wide median when
 * the dish has few days of its own, the same way a shrinkage estimator
 * avoids trusting three data points too much. Shown only once a dish has run
 * out on at least MIN_DAYS different days. */
@Service
public class SoldOutService {

    static final ZoneId CAMPUS = ZoneId.of("Asia/Kolkata");
    static final int WINDOW_DAYS = 28;
    static final int MIN_DAYS = 3;
    /** How many days of its own a dish needs before its own median outweighs the stall's. */
    static final double PRIOR_DAYS = 3.0;

    private final SoldOutEventRepository events;
    private final Clock clock;

    public SoldOutService(SoldOutEventRepository events, Clock clock) {
        this.events = events;
        this.clock = clock;
    }

    /** usually: the typical sell-out time; days: on how many of the last
     * windowDays it sold out. */
    public record SoldOutTime(Long menuItemId, LocalTime usually, int days, int windowDays) {
    }

    @Transactional(readOnly = true)
    public List<SoldOutTime> usualTimes() {
        // dish -> (day -> first sell-out minute of that day)
        Map<Long, TreeMap<LocalDate, Integer>> byDish = new HashMap<>();
        Map<Long, Long> stallOf = new HashMap<>();
        for (SoldOutEvent event : events.findSince(clock.instant().minus(Duration.ofDays(WINDOW_DAYS)))) {
            ZonedDateTime at = event.getOccurredAt().atZone(CAMPUS);
            int minute = at.getHour() * 60 + at.getMinute();
            Long dish = event.getMenuItem().getId();
            stallOf.put(dish, event.getMenuItem().getStall().getId());
            byDish.computeIfAbsent(dish, k -> new TreeMap<>()).merge(at.toLocalDate(), minute, Math::min);
        }
        // Each stall's median sell-out minute, over all its dishes' days.
        Map<Long, List<Integer>> stallMinutes = new HashMap<>();
        byDish.forEach((dish, days) -> stallMinutes.computeIfAbsent(stallOf.get(dish), k -> new ArrayList<>()).addAll(days.values()));

        List<SoldOutTime> times = new ArrayList<>();
        byDish.forEach((dish, days) -> {
            if (days.size() < MIN_DAYS) return;
            double own = median(new ArrayList<>(days.values()));
            double stall = median(stallMinutes.get(stallOf.get(dish)));
            double weight = days.size() / (days.size() + PRIOR_DAYS);
            int minute = (int) Math.round((weight * own + (1 - weight) * stall) / 15.0) * 15;
            times.add(new SoldOutTime(dish, LocalTime.of(Math.min(minute / 60, 23), minute % 60), days.size(), WINDOW_DAYS));
        });
        times.sort((a, b) -> Integer.compare(b.days(), a.days()));
        return times;
    }

    static double median(List<Integer> values) {
        List<Integer> sorted = new ArrayList<>(values);
        sorted.sort(Integer::compare);
        int n = sorted.size();
        return n % 2 == 1 ? sorted.get(n / 2) : (sorted.get(n / 2 - 1) + sorted.get(n / 2)) / 2.0;
    }
}
