package com.mealdeck.service;

import com.mealdeck.model.DishVote;
import com.mealdeck.model.MenuItem;
import com.mealdeck.model.Student;
import com.mealdeck.repository.DishVoteRepository;
import com.mealdeck.repository.MenuItemRepository;
import com.mealdeck.repository.OrderRepository;
import com.mealdeck.repository.StudentRepository;
import java.time.Clock;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** "Amazing" / "Not worth it" on dishes. Any logged-in student who says
 * they've had a dish can vote (most stalls are menu only, so a MealDeck
 * order can't be required); one vote per student per dish, and everyone
 * sees just the totals. */
@Service
public class DishVoteService {

    private final DishVoteRepository voteRepository;
    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;
    private final StudentRepository studentRepository;
    private final Clock clock;

    public DishVoteService(DishVoteRepository voteRepository, OrderRepository orderRepository,
            MenuItemRepository menuItemRepository, StudentRepository studentRepository, Clock clock) {
        this.voteRepository = voteRepository;
        this.orderRepository = orderRepository;
        this.menuItemRepository = menuItemRepository;
        this.studentRepository = studentRepository;
        this.clock = clock;
    }

    public record Counts(long amazing, long notWorthIt) {
    }

    /** votes: dish id -> true for Amazing, false for Not worth it.
     * pickedUp: dishes this student collected through MealDeck, so the
     * order screen can offer to rate them. */
    public record Mine(Map<Long, Boolean> votes, Set<Long> pickedUp) {
    }

    @Transactional(readOnly = true)
    public Map<Long, Counts> counts() {
        Map<Long, Counts> counts = new HashMap<>();
        for (Object[] row : voteRepository.countsPerDish()) {
            counts.put((Long) row[0], new Counts(((Number) row[1]).longValue(), ((Number) row[2]).longValue()));
        }
        return counts;
    }

    @Transactional(readOnly = true)
    public Mine mine(Long studentId) {
        Map<Long, Boolean> votes = new HashMap<>();
        for (DishVote vote : voteRepository.findByStudentId(studentId)) {
            votes.put(vote.getMenuItem().getId(), vote.isAmazing());
        }
        return new Mine(votes, Set.copyOf(orderRepository.collectedMenuItemIds(studentId)));
    }

    /** amazing: true, false, or null to take the vote back. */
    @Transactional
    public Boolean vote(Long studentId, Long menuItemId, Boolean amazing) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Log in as a student"));
        MenuItem item = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No dish " + menuItemId));
        var existing = voteRepository.findByStudentIdAndMenuItemId(studentId, menuItemId);
        if (amazing == null) {
            existing.ifPresent(voteRepository::delete);
            return null;
        }
        DishVote vote = existing.orElseGet(() -> new DishVote(student, item, amazing, clock.instant()));
        vote.setAmazing(amazing);
        vote.setCreatedAt(clock.instant());
        voteRepository.save(vote);
        return amazing;
    }

    List<Long> votedDishIds(Long studentId) {
        return voteRepository.findByStudentId(studentId).stream().map(v -> v.getMenuItem().getId()).toList();
    }
}
