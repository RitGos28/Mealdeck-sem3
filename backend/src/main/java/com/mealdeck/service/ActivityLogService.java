package com.mealdeck.service;

import com.mealdeck.model.ActivityLog;
import com.mealdeck.model.ActivityLog.Type;
import com.mealdeck.model.Order;
import com.mealdeck.model.OrderItem;
import com.mealdeck.repository.ActivityLogRepository;
import java.time.Clock;
import java.util.List;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** The activity trail (see ActivityLog): one line per sign-up, out-of-stock
 * report, preorder and account deletion step. Each line is written inside
 * the caller's transaction, so a signup or order that rolls back leaves no
 * line behind, and every line is also sent to the application log. */
@Service
public class ActivityLogService {

    private static final Logger log = LoggerFactory.getLogger("activity");
    public static final int MAX_PAGE = 500;

    private final ActivityLogRepository repository;
    private final Clock clock;

    public ActivityLogService(ActivityLogRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional
    public void record(Type type, Long studentId, Long subjectId, String message) {
        repository.save(new ActivityLog(clock.instant(), type, studentId, subjectId, message));
        log.info("student {} {}", studentId, message);
    }

    public void accountCreated(Long studentId) {
        record(Type.ACCOUNT_CREATED, studentId, null, "created an account");
    }

    public void outOfStockReported(Long studentId, Long menuItemId, String itemName) {
        record(Type.OUT_OF_STOCK_REPORTED, studentId, menuItemId,
                "reported item #" + menuItemId + " (" + itemName + ") as out of stock");
    }

    /** One line per order: a cart with items from two stalls is two preorders. */
    public void preordered(Long studentId, Order order) {
        String items = order.getItems().stream()
                .map((OrderItem line) -> line.getQuantity() + " x item #" + line.getMenuItem().getId())
                .collect(Collectors.joining(", "));
        record(Type.PREORDER_PLACED, studentId, order.getId(), "preordered " + items
                + " from stall #" + order.getStall().getId() + " (order #" + order.getId() + ")");
    }

    public void deletionRequested(Long studentId, long graceHours) {
        record(Type.DELETION_REQUESTED, studentId, null,
                "asked to delete their account (permanent after " + graceHours + " h unless cancelled)");
    }

    public void deletionCancelled(Long studentId) {
        record(Type.DELETION_CANCELLED, studentId, null, "cancelled their account deletion");
    }

    public void accountDeleted(Long studentId, String how) {
        record(Type.ACCOUNT_DELETED, studentId, null, "account permanently deleted (" + how + ")");
    }

    /** Lines are kept for a year, or until an admin clears them, whichever
     * comes first. */
    public static final java.time.Period RETENTION = java.time.Period.ofYears(1);

    /** Nightly: drops lines older than the retention period. */
    @Scheduled(cron = "0 45 3 * * *", zone = "Asia/Kolkata")
    @Transactional
    public int purgeExpired() {
        java.time.Instant cutoff = clock.instant().atZone(java.time.ZoneId.of("Asia/Kolkata")).minus(RETENTION).toInstant();
        int removed = repository.deleteOlderThan(cutoff);
        if (removed > 0) log.info("Activity log: removed {} lines older than a year", removed);
        return removed;
    }

    /** The admin's "clear the log": everything goes. */
    @Transactional
    public long clearAll() {
        long count = repository.count();
        repository.deleteAllInBatch();
        log.info("Activity log cleared by an admin ({} lines)", count);
        return count;
    }

    public void messMealAdded(Long studentId, String meal) {
        record(Type.MESS_MEAL_ADDED, studentId, null, "added today's " + meal + " menu to Mess today");
    }

    public void messFlagged(Long studentId, String meal) {
        record(Type.MESS_FLAGGED, studentId, null, "said today's " + meal + " mess menu isn't correct");
    }

    public void preorderRequested(Long studentId, Long stallId, String stallName) {
        record(Type.PREORDER_REQUESTED, studentId, stallId, "asked for pre-ordering at " + stallName + " (stall #" + stallId + ")");
    }

    /** No student: the menu was replaced by three students' corrections. */
    public void messMenuCorrected(String meal) {
        record(Type.MESS_MENU_CORRECTED, null, null, "Today's " + meal + " mess menu was replaced by students' corrections");
    }

    /** No student: an admin checked it. */
    public void messMenuConfirmed(String meal) {
        record(Type.MESS_MENU_CONFIRMED, null, null, "An admin confirmed today's " + meal + " mess menu as correct");
    }

    @Transactional(readOnly = true)
    public List<ActivityLog> recent(int limit) {
        return repository.findAllByOrderByIdDesc(PageRequest.of(0, Math.max(1, Math.min(limit, MAX_PAGE))));
    }

    @Transactional(readOnly = true)
    public List<ActivityLog> forStudent(Long studentId, int limit) {
        return repository.findByStudentIdOrderByIdDesc(studentId, PageRequest.of(0, Math.max(1, Math.min(limit, MAX_PAGE))));
    }
}
