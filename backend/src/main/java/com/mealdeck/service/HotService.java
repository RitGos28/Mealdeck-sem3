package com.mealdeck.service;

import com.mealdeck.repository.DealSwipeRepository;
import com.mealdeck.repository.DishVoteRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** "Most loved this week": dishes students rated Amazing or kept in Deal me
 * a dish over the last seven days. Works on menu-only stalls, since it needs
 * no orders. A dish shows only with at least MIN_LOVES between the two, and
 * never when more students said "Not worth it" than "Amazing". Totals only,
 * never who. */
@Service
public class HotService {

    static final Duration WINDOW = Duration.ofDays(7);
    static final int MIN_LOVES = 3;
    static final int LIMIT = 10;

    private final DishVoteRepository voteRepository;
    private final DealSwipeRepository swipeRepository;
    private final Clock clock;

    public HotService(DishVoteRepository voteRepository, DealSwipeRepository swipeRepository, Clock clock) {
        this.voteRepository = voteRepository;
        this.swipeRepository = swipeRepository;
        this.clock = clock;
    }

    /** amazing / notWorthIt: votes this week; keeps: times kept in Deal this week. */
    public record HotDish(Long menuItemId, Long stallId, long amazing, long notWorthIt, long keeps) {
        long loves() {
            return amazing + keeps;
        }
    }

    @Transactional(readOnly = true)
    public List<HotDish> thisWeek() {
        Instant since = clock.instant().minus(WINDOW);
        Map<Long, HotDish> byDish = new HashMap<>();
        for (Object[] row : voteRepository.countsPerDishSince(since)) {
            Long id = (Long) row[0];
            byDish.put(id, new HotDish(id, (Long) row[1], ((Number) row[2]).longValue(), ((Number) row[3]).longValue(), 0));
        }
        for (Object[] row : swipeRepository.keepsPerDishSince(since)) {
            Long id = (Long) row[0];
            long keeps = ((Number) row[2]).longValue();
            HotDish votes = byDish.get(id);
            byDish.put(id, votes == null
                    ? new HotDish(id, (Long) row[1], 0, 0, keeps)
                    : new HotDish(id, votes.stallId(), votes.amazing(), votes.notWorthIt(), keeps));
        }
        return byDish.values().stream()
                .filter(dish -> dish.loves() >= MIN_LOVES && dish.amazing() >= dish.notWorthIt())
                .sorted(Comparator.comparingLong(HotDish::loves).reversed().thenComparing(HotDish::menuItemId))
                .limit(LIMIT)
                .toList();
    }
}
