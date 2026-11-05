package com.mealdeck.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.mealdeck.FixedClockConfig;
import com.mealdeck.model.MessMeal;
import com.mealdeck.model.MessMeal.Meal;
import com.mealdeck.model.Student;
import com.mealdeck.repository.MessFlagRepository;
import com.mealdeck.repository.MessMealRepository;
import com.mealdeck.repository.StudentRepository;
import com.mealdeck.service.MessService.MealView;
import java.time.Duration;
import java.time.LocalDate;
import java.util.List;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Mess today: the first menu stands, three different students replace it
 * with the most common correction, an admin's confirm locks it. The clock
 * is pinned at 10:00 IST on 2026-09-29 (FixedClockConfig). */
@SpringBootTest
@ActiveProfiles("demo")
@Import(FixedClockConfig.class)
@Transactional
class MessServiceTests {

    @Autowired MessService mess;
    @Autowired MessMealRepository meals;
    @Autowired MessFlagRepository flags;
    @Autowired StudentRepository studentRepository;
    @Autowired StudentService studentService;

    private Long student() {
        return studentRepository.save(new Student("mess" + System.nanoTime() + "@bennett.edu.in", "unused", "Mess Student", null)).getId();
    }

    private MealView lunch(Long viewer) {
        return mess.today(viewer, false).get(1);
    }

    private static void assertRejected(ThrowingCallable call, HttpStatus status) {
        assertThatThrownBy(call).isInstanceOfSatisfying(ResponseStatusException.class,
                e -> assertThat(e.getStatusCode().value()).isEqualTo(status.value()));
    }

    @Test
    void todayAlwaysListsTheFourMealsInOrderAndLunchHasItsPrice() {
        var views = mess.today(null, false);

        assertThat(views).extracting(MealView::label).containsExactly("Breakfast", "Lunch", "Snacks", "Dinner");
        assertThat(views).allSatisfy(v -> assertThat(v.items()).isEmpty());
        assertThat(views.get(1).priceInr()).isEqualTo(70);
        assertThat(views.get(0).priceInr()).isNull();
    }

    @Test
    void theFirstMenuStandsAndASecondAddIsRefused() {
        Long first = student();
        mess.add(first, Meal.LUNCH, "Rajma, Jeera rice,\naloo gobi;  roti ");

        assertThat(lunch(null).items()).containsExactly("Rajma", "Jeera rice", "aloo gobi", "roti");
        assertThat(lunch(first).youAdded()).isTrue();
        assertThat(lunch(student()).youAdded()).isFalse();
        assertRejected(() -> mess.add(student(), Meal.LUNCH, "Something else"), HttpStatus.CONFLICT);
    }

    @Test
    void badMenusAreRefused() {
        Long s = student();
        assertRejected(() -> mess.add(s, Meal.LUNCH, "  ,  ;\n"), HttpStatus.BAD_REQUEST);
        assertRejected(() -> mess.add(s, Meal.LUNCH, "Rajma, see https://example.com"), HttpStatus.BAD_REQUEST);
        assertRejected(() -> mess.add(s, Meal.LUNCH, "x".repeat(61)), HttpStatus.BAD_REQUEST);
        assertRejected(() -> mess.add(s, Meal.LUNCH, String.join(",", java.util.Collections.nCopies(26, "a").stream().map(a -> a + System.nanoTime()).toList())), HttpStatus.BAD_REQUEST);
        // Repeats collapse instead of counting twice.
        mess.add(s, Meal.DINNER, "Dal, dal, DAL, rice");
        assertThat(mess.today(null, false).get(3).items()).containsExactly("Dal", "rice");
    }

    @Test
    void youCantFlagYourOwnMenuFlagTwiceOrFlagAnEmptyMeal() {
        Long author = student();
        Long other = student();
        assertRejected(() -> mess.flag(other, Meal.LUNCH, "Dal"), HttpStatus.NOT_FOUND);
        mess.add(author, Meal.LUNCH, "Rajma, rice");

        assertRejected(() -> mess.flag(author, Meal.LUNCH, "Dal, rice"), HttpStatus.CONFLICT);
        mess.flag(other, Meal.LUNCH, "Dal, rice");
        assertThat(lunch(other).youFlagged()).isTrue();
        assertRejected(() -> mess.flag(other, Meal.LUNCH, "Dal, rice"), HttpStatus.CONFLICT);
    }

    @Test
    void threeDifferentStudentsReplaceTheMenuWithTheMostCommonCorrection() {
        mess.add(student(), Meal.LUNCH, "Rajma, rice");
        mess.flag(student(), Meal.LUNCH, "Dal, rice");
        mess.flag(student(), Meal.LUNCH, "Paneer, roti");
        assertThat(lunch(null).items()).containsExactly("Rajma", "rice");

        // The third flag matches the first (same dishes, other order and case): that wins.
        mess.flag(student(), Meal.LUNCH, "RICE, dal");

        assertThat(lunch(null).items()).containsExactly("Dal", "rice");
        assertThat(flags.count()).isZero();
        // Flags are cleared, so a wrong replacement can be flagged again from scratch.
        mess.flag(student(), Meal.LUNCH, "Chole, rice");
        assertThat(lunch(null).items()).containsExactly("Dal", "rice");
    }

    @Test
    void whenAllThreeDisagreeTheEarliestFlagWins() {
        mess.add(student(), Meal.SNACKS, "Samosa");
        mess.flag(student(), Meal.SNACKS, "Tea, biscuits");
        mess.flag(student(), Meal.SNACKS, "Pakora");
        mess.flag(student(), Meal.SNACKS, "Maggi");

        assertThat(mess.today(null, false).get(2).items()).containsExactly("Tea", "biscuits");
    }

    @Test
    void anAdminConfirmLocksTheMenuAndUnlockReopensIt() {
        mess.add(student(), Meal.LUNCH, "Rajma, rice");
        mess.confirm(mess.today(), Meal.LUNCH);

        assertThat(lunch(null).confirmed()).isTrue();
        assertThat(lunch(null).locked()).isTrue();
        assertRejected(() -> mess.flag(student(), Meal.LUNCH, "Dal"), HttpStatus.CONFLICT);

        mess.unlock(mess.today(), Meal.LUNCH);
        assertThat(lunch(null).confirmed()).isFalse();
        mess.flag(student(), Meal.LUNCH, "Dal");
    }

    @Test
    void confirmingStopsCorrectionsEvenAfterTwoFlagsAreIn() {
        mess.add(student(), Meal.LUNCH, "Rajma, rice");
        mess.flag(student(), Meal.LUNCH, "Dal, rice");
        mess.flag(student(), Meal.LUNCH, "Dal, rice");

        mess.confirm(mess.today(), Meal.LUNCH);
        assertRejected(() -> mess.flag(student(), Meal.LUNCH, "Dal, rice"), HttpStatus.CONFLICT);

        assertThat(lunch(null).items()).containsExactly("Rajma", "rice");
    }

    @Test
    void anAdminCanSetEditAndDeleteAMenuAndSetPrices() {
        mess.adminSet(mess.today(), Meal.BREAKFAST, "Poha, tea");
        assertThat(mess.today(null, false).get(0).items()).containsExactly("Poha", "tea");

        mess.confirm(mess.today(), Meal.BREAKFAST);
        mess.adminSet(mess.today(), Meal.BREAKFAST, "Poha, egg, tea");
        assertThat(mess.today(null, false).get(0).items()).containsExactly("Poha", "egg", "tea");
        assertThat(mess.today(null, false).get(0).locked()).isTrue();

        mess.delete(mess.today(), Meal.BREAKFAST);
        assertThat(mess.today(null, false).get(0).items()).isEmpty();
        assertRejected(() -> mess.confirm(mess.today(), Meal.BREAKFAST), HttpStatus.NOT_FOUND);

        mess.setPrice(Meal.DINNER, 90);
        assertThat(mess.today(null, false).get(3).priceInr()).isEqualTo(90);
        mess.setPrice(Meal.DINNER, null);
        assertThat(mess.today(null, false).get(3).priceInr()).isNull();
        assertRejected(() -> mess.setPrice(Meal.DINNER, -5), HttpStatus.BAD_REQUEST);
    }

    @Test
    void menusAreKeptByDayAndOnlyTodaysShowsAsToday() {
        LocalDate yesterday = mess.today().minusDays(1);
        meals.save(new MessMeal(yesterday, Meal.LUNCH, List.of("Old dal"), null, FixedClockConfig.NOW.minus(Duration.ofDays(1))));

        assertThat(lunch(null).items()).isEmpty();
        assertThat(mess.forDate(yesterday).get(1).items()).containsExactly("Old dal");
        // Today's lunch can still be added: yesterday's didn't take the slot.
        mess.add(student(), Meal.LUNCH, "Fresh dal");
        assertThat(lunch(null).items()).containsExactly("Fresh dal");
    }

    @Test
    void deletingAStudentRemovesTheirFlagsAndKeepsTheirMenusAnonymously() {
        Long author = student();
        Long flagger = student();
        mess.add(author, Meal.LUNCH, "Rajma, rice");
        mess.flag(flagger, Meal.LUNCH, "Dal, rice");

        studentService.delete(flagger, "test");
        assertThat(flags.count()).isZero();

        studentService.delete(author, "test");
        assertThat(lunch(null).items()).containsExactly("Rajma", "rice");
        assertThat(meals.findByDateAndMeal(mess.today(), Meal.LUNCH).orElseThrow().getSubmittedByStudentId()).isNull();
    }

    @Test
    void flagsFromEarlierDaysAreDroppedNightly() {
        Long author = student();
        Long flagger = student();
        mess.add(author, Meal.LUNCH, "Rajma");
        mess.flag(flagger, Meal.LUNCH, "Dal");
        MessMeal old = meals.save(new MessMeal(mess.today().minusDays(1), Meal.DINNER, List.of("Old"), null, FixedClockConfig.NOW));
        flags.save(new com.mealdeck.model.MessFlag(old.getId(), flagger, "Older dal", FixedClockConfig.NOW));

        assertThat(mess.purgeOldFlags()).isEqualTo(1);
        assertThat(flags.count()).isEqualTo(1);
    }
}
