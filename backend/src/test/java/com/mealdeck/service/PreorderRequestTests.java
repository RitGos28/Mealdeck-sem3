package com.mealdeck.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.mealdeck.FixedClockConfig;
import com.mealdeck.model.Stall;
import com.mealdeck.model.Student;
import com.mealdeck.repository.PreorderRequestRepository;
import com.mealdeck.repository.StallRepository;
import com.mealdeck.repository.StudentRepository;
import com.mealdeck.service.PreorderRequestService.StallDemand;
import com.mealdeck.web.ActivityDto;
import com.mealdeck.web.MenuItemRequests.CreateStallRequest;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** "I'd pre-order here": one vote per student per menu-only stall, counted
 * per stall for the admin, and removed with the student or the stall. */
@SpringBootTest
@ActiveProfiles("demo")
@Import(FixedClockConfig.class)
@Transactional
class PreorderRequestTests {

    @Autowired PreorderRequestService service;
    @Autowired PreorderRequestRepository requests;
    @Autowired StallRepository stallRepository;
    @Autowired StudentRepository studentRepository;
    @Autowired StudentService studentService;
    @Autowired AdminAccountService adminAccountService;
    @Autowired ActivityLogService activityLog;

    private Long student() {
        return studentRepository.save(new Student("want" + System.nanoTime() + "@bennett.edu.in", "unused", "Wants Food", null)).getId();
    }

    /** A stall that doesn't take pre-orders yet (menu only). */
    private Stall menuOnly(String name) {
        Stall stall = stallRepository.save(new Stall(name));
        stall.setListingOnly(true);
        return stallRepository.save(stall);
    }

    private static void assertRejected(ThrowingCallable call, HttpStatus status) {
        assertThatThrownBy(call).isInstanceOfSatisfying(ResponseStatusException.class,
                e -> assertThat(e.getStatusCode().value()).isEqualTo(status.value()));
    }

    @Test
    void askingTwiceCountsOnceAndWithdrawingRemovesIt() {
        Stall stall = menuOnly("Wanted Stall");
        Long student = student();

        service.request(student, stall.getId());
        service.request(student, stall.getId());

        assertThat(service.mine(student)).containsExactly(stall.getId());
        assertThat(requests.count()).isEqualTo(1);

        service.withdraw(student, stall.getId());
        assertThat(service.mine(student)).isEmpty();
        service.withdraw(student, stall.getId()); // already gone: fine
    }

    @Test
    void aStallThatAlreadyTakesPreOrdersCantBeAskedFor() {
        Stall taking = stallRepository.findAllWithMenuItems().stream().filter(s -> !s.isListingOnly()).findFirst().orElseThrow();

        assertRejected(() -> service.request(student(), taking.getId()), HttpStatus.CONFLICT);
        assertRejected(() -> service.request(student(), 999_999L), HttpStatus.NOT_FOUND);
    }

    @Test
    void demandCountsStudentsPerStallMostAskedFirstAndIncludesStallsNobodyAskedFor() {
        Stall popular = menuOnly("Popular Stall");
        Stall quiet = menuOnly("Quiet Stall");
        Stall nobody = menuOnly("Nobody Stall");
        for (int i = 0; i < 3; i++) service.request(student(), popular.getId());
        service.request(student(), quiet.getId());

        var demand = service.demand();

        assertThat(demand).extracting(StallDemand::stallName).containsSubsequence("Popular Stall", "Quiet Stall", "Nobody Stall");
        assertThat(demand.stream().filter(d -> d.stallId().equals(popular.getId())).findFirst().orElseThrow().requests()).isEqualTo(3);
        assertThat(demand.stream().filter(d -> d.stallId().equals(quiet.getId())).findFirst().orElseThrow().requests()).isEqualTo(1);
        assertThat(demand.stream().filter(d -> d.stallId().equals(nobody.getId())).findFirst().orElseThrow().requests()).isZero();
        assertThat(demand.stream().filter(d -> d.stallId().equals(popular.getId())).findFirst().orElseThrow().takingOrders()).isFalse();
    }

    @Test
    void deletingTheStudentRemovesTheirRequests() {
        Stall stall = menuOnly("Wanted Stall");
        Long leaving = student();
        Long staying = student();
        service.request(leaving, stall.getId());
        service.request(staying, stall.getId());

        studentService.delete(leaving, "test");

        assertThat(requests.count()).isEqualTo(1);
        assertThat(service.mine(staying)).containsExactly(stall.getId());
    }

    @Test
    void deletingTheStallRemovesItsRequests() {
        Stall stall = adminAccountService.createStallWithVendor(new CreateStallRequest("Placeholder Stall", "placeholder@mealdeck.in", "secret123", null)).getStall();
        stall.setListingOnly(true);
        stallRepository.save(stall);
        service.request(student(), stall.getId());

        adminAccountService.deleteStall(stall.getId());

        assertThat(requests.count()).isZero();
    }

    @Test
    void askingLeavesALineInTheActivityLog() {
        Stall stall = menuOnly("Wanted Stall");
        Long student = student();

        service.request(student, stall.getId());

        var line = ActivityDto.from(activityLog.forStudent(student, 5).getFirst());
        assertThat(line.type()).isEqualTo("PREORDER_REQUESTED");
        assertThat(line.text()).isEqualTo("Student #" + student + " asked for pre-ordering at Wanted Stall (stall #" + stall.getId() + ")");
    }

    @Autowired MenuService menuService;
    @Autowired com.mealdeck.repository.ReportRepository reportRepository;

    @Test
    void deletingAStudentWhoReportedADishOutOfStockWorksAndClearsTheirReports() {
        Stall stall = stallRepository.findAllWithMenuItems().stream().filter(x -> !x.getMenuItems().isEmpty()).findFirst().orElseThrow();
        Long reporter = student();
        menuService.reportOutOfStock(stall.getMenuItems().getFirst().getId(), reporter);
        assertThat(reportRepository.count()).isEqualTo(1);

        studentService.delete(reporter, "test");

        assertThat(reportRepository.count()).isZero();
        assertThat(studentRepository.findById(reporter)).isEmpty();
    }
}
