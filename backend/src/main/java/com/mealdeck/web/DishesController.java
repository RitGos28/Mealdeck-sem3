package com.mealdeck.web;

import com.mealdeck.repository.StudentRepository;
import com.mealdeck.service.DealLearningService;
import com.mealdeck.service.DealLearningService.Scores;
import com.mealdeck.service.DealLearningService.Swipe;
import com.mealdeck.service.DishVoteService;
import com.mealdeck.service.DishVoteService.Counts;
import com.mealdeck.service.DishVoteService.Mine;
import com.mealdeck.service.HotService;
import com.mealdeck.service.HotService.HotDish;
import com.mealdeck.service.SoldOutService;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** What students think of dishes: Hot this week, Amazing / Not worth it
 * votes, and the Deal me a dish model. Public reads carry only totals and
 * scores, never who did what. Writes under /api/account/** and POST
 * /api/deal/swipes need a student login (SecurityConfig). */
@RestController
public class DishesController {

    private final HotService hotService;
    private final DishVoteService voteService;
    private final DealLearningService dealLearning;
    private final StudentRepository studentRepository;

    private final SoldOutService soldOutService;

    public DishesController(HotService hotService, DishVoteService voteService,
            DealLearningService dealLearning, StudentRepository studentRepository, SoldOutService soldOutService) {
        this.soldOutService = soldOutService;
        this.hotService = hotService;
        this.voteService = voteService;
        this.dealLearning = dealLearning;
        this.studentRepository = studentRepository;
    }

    @GetMapping("/api/hot")
    public List<HotDish> hot() {
        return hotService.thisWeek();
    }

    /** "Often sold out by 2 PM", for dishes that ran out on enough days lately. */
    @GetMapping("/api/sold-out-times")
    public List<SoldOutService.SoldOutTime> soldOutTimes() {
        return soldOutService.usualTimes();
    }

    /** Vote totals for every dish that has any. */
    @GetMapping("/api/votes")
    public Map<Long, Counts> votes() {
        return voteService.counts();
    }

    @GetMapping("/api/account/votes")
    public Mine myVotes(Authentication authentication) {
        return voteService.mine(studentId(authentication));
    }

    /** vote: "AMAZING", "NOT_WORTH_IT", or null to take it back. */
    public record VoteRequest(String vote) {
    }

    public record VoteResponse(String vote) {
    }

    @PutMapping("/api/account/votes/{menuItemId}")
    public VoteResponse vote(Authentication authentication, @PathVariable Long menuItemId, @RequestBody VoteRequest request) {
        Boolean amazing = switch (request.vote() == null ? "" : request.vote()) {
            case "AMAZING" -> true;
            case "NOT_WORTH_IT" -> false;
            case "" -> null;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "vote must be AMAZING, NOT_WORTH_IT or null");
        };
        Boolean saved = voteService.vote(studentId(authentication), menuItemId, amazing);
        return new VoteResponse(saved == null ? null : saved ? "AMAZING" : "NOT_WORTH_IT");
    }

    public record SwipesRequest(List<Swipe> swipes) {
    }

    public record SwipesResponse(int learned) {
    }

    /** A finished hand's keeps and skips, from a logged-in student. */
    @PostMapping("/api/deal/swipes")
    public SwipesResponse swipes(Authentication authentication, @RequestBody SwipesRequest request) {
        return new SwipesResponse(dealLearning.record(studentId(authentication), request.swipes()));
    }

    public record ScoresRequest(List<Long> menuItemIds) {
    }

    /** Anyone may ask; a logged-in student with learning on gets scores
     * shaped by their own swipes too. */
    @PostMapping("/api/deal/scores")
    public Scores scores(Authentication authentication, @RequestBody ScoresRequest request) {
        List<Long> ids = request.menuItemIds() == null ? List.of() : request.menuItemIds();
        if (ids.size() > 2000) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Too many dishes");
        return dealLearning.scores(optionalStudentId(authentication), ids);
    }

    public record LearningRequest(boolean on) {
    }

    public record LearningResponse(boolean on) {
    }

    /** Turning learning off deletes the swipes it learned from. */
    @PutMapping("/api/account/deal-learning")
    public LearningResponse learning(Authentication authentication, @RequestBody LearningRequest request) {
        return new LearningResponse(dealLearning.setLearning(studentId(authentication), request.on()));
    }

    private Long studentId(Authentication authentication) {
        Long id = optionalStudentId(authentication);
        if (id == null) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Log in as a student");
        return id;
    }

    private Long optionalStudentId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return null;
        return studentRepository.findByEmail(authentication.getName()).map(s -> s.getId()).orElse(null);
    }
}
