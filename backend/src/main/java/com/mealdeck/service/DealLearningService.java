package com.mealdeck.service;

import com.mealdeck.model.DealSwipe;
import com.mealdeck.model.MenuItem;
import com.mealdeck.model.Student;
import com.mealdeck.repository.DealSwipeRepository;
import com.mealdeck.repository.MenuItemRepository;
import com.mealdeck.repository.StudentRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** "Deal me a dish" learns what students keep. Two models, both trained
 * online on every swipe:
 *  - a shared one, from every student's swipes, so everyone's deals get
 *    better (and a logged-out player gets its scores);
 *  - a personal one per student, which learns how they differ from the
 *    shared one.
 * A dish's score is sigmoid(shared + personal). The models live in memory
 * and are rebuilt from the stored swipes at startup; the swipes are what's
 * kept, so turning learning off or deleting the account removes a
 * student's data from both. */
@Service
public class DealLearningService {

    private static final Logger log = LoggerFactory.getLogger(DealLearningService.class);

    /** Most swipes accepted in one request (a hand is ten cards). */
    static final int MAX_SWIPES = 40;

    private final DealSwipeRepository swipeRepository;
    private final MenuItemRepository menuItemRepository;
    private final StudentRepository studentRepository;
    private final Clock clock;

    private DealModel shared = new DealModel();
    private final Map<Long, DealModel> personal = new ConcurrentHashMap<>();

    public DealLearningService(DealSwipeRepository swipeRepository, MenuItemRepository menuItemRepository,
            StudentRepository studentRepository, Clock clock) {
        this.swipeRepository = swipeRepository;
        this.menuItemRepository = menuItemRepository;
        this.studentRepository = studentRepository;
        this.clock = clock;
    }

    public record Swipe(Long menuItemId, boolean kept) {
    }

    /** scores: menu item id -> chance of being kept. personal: whether this
     * student's own swipes shaped them. swipesLearned: their swipes on file. */
    public record Scores(Map<Long, Double> scores, boolean personal, long swipesLearned) {
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional(readOnly = true)
    public void rebuild() {
        DealModel fresh = new DealModel();
        List<DealSwipe> all = swipeRepository.findAllForTraining();
        for (DealSwipe swipe : all) fresh.learn(swipe.getMenuItem(), swipe.isKept(), 0);
        synchronized (this) {
            shared = fresh;
            personal.clear();
        }
        if (!all.isEmpty()) log.info("Deal model rebuilt from {} swipes", all.size());
    }

    /** Stores a finished hand's swipes and learns from them. Ignored (0) when
     * the student has turned learning off. */
    @Transactional
    public int record(Long studentId, List<Swipe> swipes) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Log in as a student"));
        if (!student.isDealLearning() || swipes == null || swipes.isEmpty()) return 0;
        if (swipes.size() > MAX_SWIPES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At most " + MAX_SWIPES + " swipes at a time");
        }
        Map<Long, MenuItem> items = new HashMap<>();
        menuItemRepository.findAllById(swipes.stream().map(Swipe::menuItemId).toList())
                .forEach(item -> items.put(item.getId(), item));
        Instant now = clock.instant();
        DealModel mine = personalModel(studentId);
        int learned = 0;
        for (Swipe swipe : swipes) {
            MenuItem item = items.get(swipe.menuItemId());
            if (item == null) continue;
            swipeRepository.save(new DealSwipe(student, item, swipe.kept(), now));
            synchronized (this) {
                double before = shared.logit(item);
                shared.learn(item, swipe.kept(), 0);
                mine.learn(item, swipe.kept(), before);
            }
            learned++;
        }
        return learned;
    }

    /** Scores for these dishes: shared only for a logged-out player or one
     * with learning off, shared plus personal otherwise. */
    @Transactional(readOnly = true)
    public Scores scores(Long studentIdOrNull, Collection<Long> menuItemIds) {
        boolean usePersonal = studentIdOrNull != null && studentRepository.findById(studentIdOrNull)
                .map(Student::isDealLearning).orElse(false);
        DealModel mine = usePersonal ? personalModel(studentIdOrNull) : null;
        Map<Long, Double> scores = new HashMap<>();
        synchronized (this) {
            for (MenuItem item : menuItemRepository.findAllById(menuItemIds)) {
                double logit = shared.logit(item) + (mine != null ? mine.logit(item) : 0);
                scores.put(item.getId(), DealModel.sigmoid(logit));
            }
        }
        long learned = usePersonal ? swipeRepository.countByStudentId(studentIdOrNull) : 0;
        return new Scores(scores, usePersonal && learned > 0, learned);
    }

    /** Turns learning on or off. Off deletes the student's swipes and
     * retrains the shared model without them. */
    @Transactional
    public boolean setLearning(Long studentId, boolean on) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Log in as a student"));
        student.setDealLearning(on);
        studentRepository.save(student);
        if (!on) forget(studentId);
        return on;
    }

    /** Removes everything learned from this student: their swipes, their
     * personal model, and their part in the shared one. */
    @Transactional
    public void forget(Long studentId) {
        if (swipeRepository.deleteByStudentId(studentId) > 0) {
            swipeRepository.flush();
            rebuild();
        }
        personal.remove(studentId);
    }

    /** The student's personal model, replayed from their stored swipes the
     * first time it's needed (after a restart). */
    private DealModel personalModel(Long studentId) {
        return personal.computeIfAbsent(studentId, id -> {
            DealModel model = new DealModel();
            synchronized (this) {
                for (DealSwipe swipe : swipeRepository.findByStudentForTraining(id)) {
                    model.learn(swipe.getMenuItem(), swipe.isKept(), shared.logit(swipe.getMenuItem()));
                }
            }
            return model;
        });
    }
}
