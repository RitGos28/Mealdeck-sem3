package com.mealdeck.service;

import com.mealdeck.model.PreorderRequest;
import com.mealdeck.model.Stall;
import com.mealdeck.repository.PreorderRequestRepository;
import com.mealdeck.repository.StallRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** "I'd pre-order here": a student's vote for a menu-only stall to join
 * pre-ordering. The per-stall count is the proof of demand to show a stall. */
@Service
public class PreorderRequestService {

    /** One stall's demand: how many students asked, and when the latest asked. */
    public record StallDemand(Long stallId, String stallName, boolean takingOrders, long requests, Instant latest) {
    }

    private final PreorderRequestRepository requests;
    private final StallRepository stalls;
    private final ActivityLogService activityLog;
    private final Clock clock;

    public PreorderRequestService(PreorderRequestRepository requests, StallRepository stalls, ActivityLogService activityLog, Clock clock) {
        this.requests = requests;
        this.stalls = stalls;
        this.activityLog = activityLog;
        this.clock = clock;
    }

    /** Idempotent: asking twice is the same as asking once. Only menu-only
     * stalls can be asked, since the others already take pre-orders. */
    @Transactional
    public void request(Long studentId, Long stallId) {
        Stall stall = stalls.findById(stallId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No stall " + stallId));
        if (!stall.isListingOnly()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, stall.getName() + " already takes pre-orders on MealDeck.");
        }
        if (requests.existsByStallIdAndStudentId(stallId, studentId)) return;
        requests.save(new PreorderRequest(stallId, studentId, clock.instant()));
        activityLog.preorderRequested(studentId, stallId, stall.getName());
    }

    @Transactional
    public void withdraw(Long studentId, Long stallId) {
        requests.deleteByStallIdAndStudentId(stallId, studentId);
    }

    /** The ids of the stalls this student has asked for. */
    @Transactional(readOnly = true)
    public List<Long> mine(Long studentId) {
        return requests.findByStudentId(studentId).stream().map(PreorderRequest::getStallId).toList();
    }

    /** Every stall with how many students asked, most asked first. Stalls
     * nobody has asked for are included, with 0. */
    @Transactional(readOnly = true)
    public List<StallDemand> demand() {
        Map<Long, Object[]> counts = new HashMap<>();
        for (Object[] row : requests.countsByStall()) counts.put((Long) row[0], row);
        List<StallDemand> result = new ArrayList<>();
        for (Stall stall : stalls.findAll()) {
            Object[] row = counts.get(stall.getId());
            result.add(new StallDemand(stall.getId(), stall.getName(), !stall.isListingOnly(),
                    row == null ? 0 : ((Number) row[1]).longValue(), row == null ? null : (Instant) row[2]));
        }
        result.sort(Comparator.comparingLong(StallDemand::requests).reversed().thenComparing(StallDemand::stallName));
        return result;
    }
}
