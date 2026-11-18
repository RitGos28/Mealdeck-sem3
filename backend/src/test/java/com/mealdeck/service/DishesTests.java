package com.mealdeck.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.mealdeck.FixedClockConfig;
import com.mealdeck.model.MenuItem;
import com.mealdeck.model.Order;
import com.mealdeck.model.OrderStatus;
import com.mealdeck.model.Stall;
import com.mealdeck.model.Student;
import com.mealdeck.repository.DealSwipeRepository;
import com.mealdeck.repository.DishVoteRepository;
import com.mealdeck.repository.StallRepository;
import com.mealdeck.repository.StudentRepository;
import com.mealdeck.service.DealLearningService.Swipe;
import com.mealdeck.web.OrderRequests.CreateOrderRequest;
import com.mealdeck.web.OrderRequests.OrderItemRequest;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/** Hot this week, Amazing / Not worth it, and the Deal me a dish model,
 * on the demo profile's seeded stalls with the clock pinned to 10:00 IST. */
@SpringBootTest
@ActiveProfiles("demo")
@Import(FixedClockConfig.class)
@Transactional
class DishesTests {

    @Autowired
    HotService hotService;

    @Autowired
    DishVoteService voteService;

    @Autowired
    DealLearningService dealLearning;

    @Autowired
    OrderService orderService;

    @Autowired
    StudentService studentService;

    @Autowired
    StallRepository stallRepository;

    @Autowired
    StudentRepository studentRepository;

    @Autowired
    DishVoteRepository voteRepository;

    @Autowired
    DealSwipeRepository swipeRepository;

    private Stall bistro() {
        return stallRepository.findAllWithMenuItems().stream()
                .filter(s -> s.getName().equals("Bistro / Kathi")).findFirst().orElseThrow();
    }

    private MenuItem dish(String name) {
        return stallRepository.findAllWithMenuItems().stream().flatMap(s -> s.getMenuItems().stream())
                .filter(item -> item.getName().equals(name)).findFirst().orElseThrow();
    }

    private Student student() {
        return studentRepository.save(new Student("dish" + System.nanoTime() + "@bennett.edu.in", "x", "Dish Test", null));
    }

    private Order order(Student student, MenuItem item, String time) {
        return orderService.checkout(student.getId(), new CreateOrderRequest(
                List.of(new OrderItemRequest(item.getId(), 1)),
                Map.of(item.getStall().getId(), LocalTime.parse(time)))).getFirst();
    }

    private void collect(Order order) {
        Long stallId = order.getStall().getId();
        orderService.advanceStatus(stallId, order.getId(), OrderStatus.ACCEPTED);
        orderService.advanceStatus(stallId, order.getId(), OrderStatus.READY);
        orderService.advanceStatus(stallId, order.getId(), OrderStatus.COMPLETED);
    }

    @Test
    void mostLovedCountsAmazingVotesAndDealKeeps() {
        MenuItem sandwich = dish("Veg Sandwich");
        MenuItem roll = dish("Paneer Kathi Roll");
        MenuItem coffee = dish("Cold Coffee");
        // Sandwich: 2 Amazing + 1 Deal keep = 3 loves, enough to show.
        voteService.vote(student().getId(), sandwich.getId(), true);
        voteService.vote(student().getId(), sandwich.getId(), true);
        dealLearning.record(student().getId(), List.of(new Swipe(sandwich.getId(), true)));
        // Roll: 2 keeps, under the minimum.
        dealLearning.record(student().getId(), List.of(new Swipe(roll.getId(), true)));
        dealLearning.record(student().getId(), List.of(new Swipe(roll.getId(), true)));
        // Coffee: 3 Amazing but 4 Not worth it, so never "loved".
        for (int i = 0; i < 3; i++) voteService.vote(student().getId(), coffee.getId(), true);
        for (int i = 0; i < 4; i++) voteService.vote(student().getId(), coffee.getId(), false);

        List<HotService.HotDish> hot = hotService.thisWeek();

        assertThat(hot).extracting(HotService.HotDish::menuItemId).containsExactly(sandwich.getId());
        assertThat(hot.getFirst()).extracting(HotService.HotDish::amazing, HotService.HotDish::keeps).containsExactly(2L, 1L);
    }

    @Test
    void anyLoggedInStudentCanVoteOnceAndChangeTheirMind() {
        Student student = student();
        MenuItem sandwich = dish("Veg Sandwich");

        voteService.vote(student.getId(), sandwich.getId(), true);
        voteService.vote(student.getId(), sandwich.getId(), false); // changed their mind

        // Still one vote, now the other way.
        assertThat(voteService.counts().get(sandwich.getId())).isEqualTo(new DishVoteService.Counts(0, 1));
        assertThat(voteService.mine(student.getId()).votes()).containsEntry(sandwich.getId(), false);

        voteService.vote(student.getId(), sandwich.getId(), null);
        assertThat(voteService.counts()).doesNotContainKey(sandwich.getId());
    }

    @Test
    void theDealModelLearnsWhatAStudentKeeps() {
        Student student = student();
        MenuItem roll = dish("Paneer Kathi Roll");
        MenuItem coffee = dish("Cold Coffee");
        for (int i = 0; i < 6; i++) {
            dealLearning.record(student.getId(), List.of(new Swipe(roll.getId(), true), new Swipe(coffee.getId(), false)));
        }

        DealLearningService.Scores scores = dealLearning.scores(student.getId(), List.of(roll.getId(), coffee.getId()));

        assertThat(scores.personal()).isTrue();
        assertThat(scores.swipesLearned()).isEqualTo(12);
        assertThat(scores.scores().get(roll.getId())).isGreaterThan(0.7);
        assertThat(scores.scores().get(coffee.getId())).isLessThan(0.3);
        // A related dish it has never seen, sharing "kathi roll", scores
        // above the skipped coffee too.
        MenuItem chickenRoll = dish("Chicken Kathi Roll");
        assertThat(dealLearning.scores(student.getId(), List.of(chickenRoll.getId())).scores().get(chickenRoll.getId()))
                .isGreaterThan(scores.scores().get(coffee.getId()));
    }

    @Test
    void turningLearningOffDeletesTheSwipesAndStopsRecording() {
        Student student = student();
        MenuItem roll = dish("Paneer Kathi Roll");
        dealLearning.record(student.getId(), List.of(new Swipe(roll.getId(), true)));
        assertThat(swipeRepository.countByStudentId(student.getId())).isEqualTo(1);

        dealLearning.setLearning(student.getId(), false);

        assertThat(swipeRepository.countByStudentId(student.getId())).isZero();
        assertThat(dealLearning.record(student.getId(), List.of(new Swipe(roll.getId(), true)))).isZero();
        assertThat(dealLearning.scores(student.getId(), List.of(roll.getId())).personal()).isFalse();
    }

    @Test
    void deletingTheAccountRemovesVotesAndSwipes() {
        Student student = student();
        MenuItem sandwich = dish("Veg Sandwich");
        collect(order(student, sandwich, "11:00"));
        assertThat(voteService.mine(student.getId()).pickedUp()).contains(sandwich.getId());
        voteService.vote(student.getId(), sandwich.getId(), true);
        dealLearning.record(student.getId(), List.of(new Swipe(sandwich.getId(), true)));

        studentService.delete(student.getId(), "test");

        assertThat(voteRepository.findByStudentId(student.getId())).isEmpty();
        assertThat(swipeRepository.countByStudentId(student.getId())).isZero();
    }

    @Autowired
    MenuService menuService;

    @Autowired
    SoldOutService soldOutService;

    @Autowired
    com.mealdeck.repository.SoldOutEventRepository soldOutRepository;

    /** An instant on a past day at a campus wall-clock time. */
    private java.time.Instant campus(int daysAgo, String time) {
        return java.time.LocalDate.of(2026, 9, 29).minusDays(daysAgo).atTime(LocalTime.parse(time))
                .atZone(java.time.ZoneId.of("Asia/Kolkata")).toInstant();
    }

    @Test
    void theThirdStudentReportRecordsOneAnonymousSoldOutEvent() {
        MenuItem sandwich = dish("Veg Sandwich");
        long before = soldOutRepository.count();
        for (int i = 0; i < 4; i++) menuService.reportOutOfStock(sandwich.getId(), student().getId());

        // Hidden on the third report; the fourth doesn't record it again.
        assertThat(soldOutRepository.count()).isEqualTo(before + 1);
    }

    @Test
    void learnsWhenADishUsuallySellsOut() {
        MenuItem roll = dish("Paneer Kathi Roll");
        MenuItem sandwich = dish("Veg Sandwich");
        // The roll ran out on four days, around 2 PM; the first sell-out of a day counts.
        soldOutRepository.save(new com.mealdeck.model.SoldOutEvent(roll, campus(1, "14:00"), false));
        soldOutRepository.save(new com.mealdeck.model.SoldOutEvent(roll, campus(1, "18:00"), true));
        soldOutRepository.save(new com.mealdeck.model.SoldOutEvent(roll, campus(2, "13:50"), false));
        soldOutRepository.save(new com.mealdeck.model.SoldOutEvent(roll, campus(4, "14:10"), true));
        soldOutRepository.save(new com.mealdeck.model.SoldOutEvent(roll, campus(6, "14:05"), false));
        // The sandwich only twice: not enough to say anything yet.
        soldOutRepository.save(new com.mealdeck.model.SoldOutEvent(sandwich, campus(1, "12:00"), false));
        soldOutRepository.save(new com.mealdeck.model.SoldOutEvent(sandwich, campus(3, "12:30"), false));
        // Six weeks ago: outside the four-week window, ignored.
        soldOutRepository.save(new com.mealdeck.model.SoldOutEvent(sandwich, campus(40, "12:15"), false));

        List<SoldOutService.SoldOutTime> times = soldOutService.usualTimes();

        assertThat(times).extracting(SoldOutService.SoldOutTime::menuItemId).containsExactly(roll.getId());
        SoldOutService.SoldOutTime roll2pm = times.getFirst();
        assertThat(roll2pm.days()).isEqualTo(4);
        // Its own median is 14:02; pulled a little towards the stall's (which
        // includes the sandwich's noon sell-outs), so somewhere 13:30-14:15.
        assertThat(roll2pm.usually()).isBetween(LocalTime.of(13, 30), LocalTime.of(14, 15));
    }
}
