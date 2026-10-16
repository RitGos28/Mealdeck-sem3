package com.mealdeck.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.mealdeck.FixedClockConfig;
import com.mealdeck.model.MenuItem;
import com.mealdeck.model.Stall;
import com.mealdeck.model.Student;
import com.mealdeck.repository.MenuItemRepository;
import com.mealdeck.repository.ReportRepository;
import com.mealdeck.repository.StallRepository;
import com.mealdeck.repository.StudentRepository;
import com.mealdeck.web.MenuItemRequests.UpdateMenuItemRequest;
import com.mealdeck.web.MenuItemRequests.UpdateStallRequest;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalTime;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Out-of-stock voting, the daily reset, item stall scoping and stall
 * settings. Shares PickupSlotTests' context and rolls back per test. */
@SpringBootTest
@ActiveProfiles("demo")
@Import(FixedClockConfig.class)
@Transactional
class MenuServiceTests {

    @Autowired
    MenuService menuService;

    @Autowired
    StallRepository stallRepository;

    @Autowired
    MenuItemRepository menuItemRepository;

    @Autowired
    ReportRepository reportRepository;

    @Autowired
    StudentRepository studentRepository;

    @Autowired
    JdbcTemplate jdbc;

    private Stall stall(String name) {
        return stallRepository.findAllWithMenuItems().stream()
                .filter(s -> s.getName().equals(name)).findFirst().orElseThrow();
    }

    private Long itemId(String stallName) {
        return stall(stallName).getMenuItems().getFirst().getId();
    }

    private MenuItem reload(Long itemId) {
        return menuItemRepository.findById(itemId).orElseThrow();
    }

    private Long newStudent(String name) {
        return studentRepository.save(new Student(name + "@bennett.edu.in", "unused", name, null)).getId();
    }

    private static void assertRejected(ThrowingCallable call, HttpStatus status) {
        assertThatThrownBy(call).isInstanceOfSatisfying(ResponseStatusException.class,
                e -> assertThat(e.getStatusCode().value()).isEqualTo(status.value()));
    }

    @Test
    void thirdDistinctStudentsReportHidesTheItem() {
        Long item = itemId("Bistro / Kathi");

        menuService.reportOutOfStock(item, newStudent("one"));
        menuService.reportOutOfStock(item, newStudent("two"));
        assertThat(reload(item).isAvailable()).isTrue();
        assertThat(reload(item).getReportCount()).isEqualTo(2);

        menuService.reportOutOfStock(item, newStudent("three"));
        assertThat(reload(item).isAvailable()).isFalse();
    }

    @Test
    void sameStudentCantVoteTwiceWithinTheCooldown() {
        Long item = itemId("Bistro / Kathi");
        Long student = newStudent("repeat");
        menuService.reportOutOfStock(item, student);

        assertRejected(() -> menuService.reportOutOfStock(item, student), HttpStatus.CONFLICT);
        assertThat(reload(item).getReportCount()).isEqualTo(1);

        // Still inside the 4h window after 3h; MenuService reads the real
        // clock here, so backdate the vote instead of moving time.
        backdateReports(Duration.ofHours(3));
        assertRejected(() -> menuService.reportOutOfStock(item, student), HttpStatus.CONFLICT);

        backdateReports(Duration.ofHours(5));
        menuService.reportOutOfStock(item, student);
        assertThat(reload(item).getReportCount()).isEqualTo(2);
    }

    @Test
    void oneStudentVotingAgainAfterTheCooldownCantHideTheItemAlone() {
        Long item = itemId("Bistro / Kathi");
        Long student = newStudent("persistent");
        for (int vote = 0; vote < 3; vote++) {
            menuService.reportOutOfStock(item, student);
            backdateReports(Duration.ofHours(5));
        }

        // Three votes on the total, but one student: still visible.
        assertThat(reload(item).getReportCount()).isEqualTo(3);
        assertThat(reload(item).isAvailable()).isTrue();

        menuService.reportOutOfStock(item, newStudent("second"));
        assertThat(reload(item).isAvailable()).isTrue();
        menuService.reportOutOfStock(item, newStudent("third"));
        assertThat(reload(item).isAvailable()).isFalse();
    }

    private void backdateReports(Duration age) {
        jdbc.update("update report set created_at = ?", Timestamp.from(Instant.now().minus(age)));
    }

    @Test
    void reportingAnUnknownItemIsNotFound() {
        assertRejected(() -> menuService.reportOutOfStock(999_999L, newStudent("lost")), HttpStatus.NOT_FOUND);
    }

    @Test
    void restockingClearsVotesSoTheSameStudentsCanReportAgain() {
        Stall bistro = stall("Bistro / Kathi");
        Long item = bistro.getMenuItems().getFirst().getId();
        Long first = newStudent("a");
        menuService.reportOutOfStock(item, first);
        menuService.reportOutOfStock(item, newStudent("b"));
        menuService.reportOutOfStock(item, newStudent("c"));
        assertThat(reload(item).isAvailable()).isFalse();

        menuService.updateItem(bistro.getId(), item, new UpdateMenuItemRequest(null, null, null, true));

        assertThat(reload(item).isAvailable()).isTrue();
        assertThat(reload(item).getReportCount()).isZero();
        assertThat(reportRepository.count()).isZero();
        menuService.reportOutOfStock(item, first);
        assertThat(reload(item).getReportCount()).isEqualTo(1);
    }

    @Test
    void markingAnItemUnavailableKeepsItsVotes() {
        Stall bistro = stall("Bistro / Kathi");
        Long item = bistro.getMenuItems().getFirst().getId();
        menuService.reportOutOfStock(item, newStudent("early"));

        menuService.updateItem(bistro.getId(), item, new UpdateMenuItemRequest(null, null, null, false));

        assertThat(reload(item).getReportCount()).isEqualTo(1);
        assertThat(reportRepository.count()).isEqualTo(1);
    }

    @Test
    void dailyResetRestocksEverythingAndClearsVotes() {
        Long item = itemId("Bistro / Kathi");
        menuService.reportOutOfStock(item, newStudent("x"));
        menuService.reportOutOfStock(item, newStudent("y"));
        menuService.reportOutOfStock(item, newStudent("z"));
        Long other = itemId("Quench");
        MenuItem quenchItem = reload(other);
        quenchItem.setAvailable(false);
        menuItemRepository.saveAndFlush(quenchItem);

        menuService.resetDailyAvailability();

        assertThat(menuItemRepository.findAll()).allSatisfy(i -> {
            assertThat(i.isAvailable()).isTrue();
            assertThat(i.getReportCount()).isZero();
        });
        assertThat(reportRepository.count()).isZero();
    }

    @Test
    void vendorCantEditOrDeleteAnotherStallsItem() {
        Stall bistro = stall("Bistro / Kathi");
        MenuItem coffee = stall("SnapEats").getMenuItems().getFirst();
        BigDecimal price = coffee.getPrice();

        assertRejected(() -> menuService.updateItem(bistro.getId(), coffee.getId(),
                new UpdateMenuItemRequest("Hacked", BigDecimal.ONE, null, false)), HttpStatus.FORBIDDEN);
        assertRejected(() -> menuService.deleteItem(bistro.getId(), coffee.getId()), HttpStatus.FORBIDDEN);

        MenuItem after = reload(coffee.getId());
        assertThat(after.getName()).isEqualTo("Cold Coffee");
        assertThat(after.getPrice()).isEqualByComparingTo(price);
        assertThat(after.isAvailable()).isTrue();
    }

    @Test
    void slotCapacityMustBeBetweenOneAndTwoHundred() {
        Long bistro = stall("Bistro / Kathi").getId();

        assertRejected(() -> menuService.updateStall(bistro, new UpdateStallRequest(null, null, null, 0)), HttpStatus.BAD_REQUEST);
        assertRejected(() -> menuService.updateStall(bistro, new UpdateStallRequest(null, null, null, 201)), HttpStatus.BAD_REQUEST);
        assertThat(menuService.getStall(bistro).getSlotCapacity()).isEqualTo(Stall.DEFAULT_SLOT_CAPACITY);

        assertThat(menuService.updateStall(bistro, new UpdateStallRequest(null, null, null, 1)).getSlotCapacity()).isEqualTo(1);
        assertThat(menuService.updateStall(bistro, new UpdateStallRequest(null, null, null, 200)).getSlotCapacity()).isEqualTo(200);
    }

    @Test
    void stallUpdateLeavesNullFieldsUnchanged() {
        Long bistro = stall("Bistro / Kathi").getId();
        menuService.updateStall(bistro, new UpdateStallRequest(null, null, null, 40));

        Stall updated = menuService.updateStall(bistro, new UpdateStallRequest(null, LocalTime.of(21, 0), true, null));

        assertThat(updated.getSlotCapacity()).isEqualTo(40);
        assertThat(updated.getOpenTime()).isEqualTo(LocalTime.of(8, 0));
        assertThat(updated.getCloseTime()).isEqualTo(LocalTime.of(21, 0));
        assertThat(updated.isClosedToday()).isTrue();
    }
}
