package com.mealdeck.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.mealdeck.FixedClockConfig;
import com.mealdeck.model.MenuItem;
import com.mealdeck.model.Stall;
import com.mealdeck.model.Student;
import com.mealdeck.model.Order;
import com.mealdeck.model.OrderStatus;
import com.mealdeck.repository.OrderRepository;
import com.mealdeck.repository.StallRepository;
import com.mealdeck.repository.StudentRepository;
import com.mealdeck.web.OrderRequests.CreateOrderRequest;
import com.mealdeck.web.OrderRequests.OrderItemRequest;
import java.time.Duration;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Deleting your own account: password check, the 24-hour grace period,
 * the ordering limits during it, cancelling, and the final delete. The
 * clock is pinned at 10:00 IST (FixedClockConfig); "when the deletion was
 * asked for" is set directly to move a test to a point in the grace period. */
@SpringBootTest
@ActiveProfiles("demo")
@Import(FixedClockConfig.class)
@Transactional
class AccountDeletionTests {

    private static final String PASSWORD = "deleteme123";

    @Autowired
    AccountDeletionService accountDeletion;

    @Autowired
    OrderService orderService;

    @Autowired
    StudentRepository studentRepository;

    @Autowired
    StallRepository stallRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    OrderRepository orderRepository;

    private Student newStudent() {
        return studentRepository.save(new Student("leaving" + System.nanoTime() + "@bennett.edu.in", passwordEncoder.encode(PASSWORD), "Leaving Student", null));
    }

    /** Deletion asked for `ago` before now (10:00 IST). */
    private Student askedAgo(Student student, Duration ago) {
        student.setDeletionRequestedAt(FixedClockConfig.NOW.minus(ago));
        return studentRepository.save(student);
    }

    private Stall bistro() {
        return stallRepository.findAllWithMenuItems().stream().filter(s -> s.getName().equals("Bistro / Kathi")).findFirst().orElseThrow();
    }

    private Order orderAt(Student student, LocalTime time) {
        Stall stall = bistro();
        MenuItem item = stall.getMenuItems().getFirst();
        return orderService.checkout(student.getId(), new CreateOrderRequest(List.of(new OrderItemRequest(item.getId(), 1)), Map.of(stall.getId(), time))).getFirst();
    }

    private static void assertRejected(ThrowingCallable call, HttpStatus status) {
        assertThatThrownBy(call).isInstanceOfSatisfying(ResponseStatusException.class,
                e -> assertThat(e.getStatusCode().value()).isEqualTo(status.value()));
    }

    @Test
    void askingNeedsTheRightPasswordAndSchedulesDeletionADayLater() {
        Student student = newStudent();

        assertRejected(() -> accountDeletion.request(student.getId(), "wrong-password"), HttpStatus.FORBIDDEN);
        assertThat(accountDeletion.status(student).scheduledFor()).isNull();

        var status = accountDeletion.request(student.getId(), PASSWORD);
        assertThat(status.scheduledFor()).isEqualTo(FixedClockConfig.NOW.plus(Duration.ofHours(24)));
        assertThat(status.orderingBlocked()).isFalse();
    }

    @Test
    void cantAskWhileAnOrderIsStillBeingPrepared() {
        Student student = newStudent();
        orderAt(student, LocalTime.NOON);

        assertRejected(() -> accountDeletion.request(student.getId(), PASSWORD), HttpStatus.CONFLICT);
    }

    @Test
    void duringTheGracePeriodPickupsMustBeBeforeTheFinalHour() {
        // Asked 21 h ago: deleted at 13:00, ordering stops at 12:00.
        Student student = askedAgo(newStudent(), Duration.ofHours(21));

        assertRejected(() -> orderAt(student, LocalTime.of(12, 30)), HttpStatus.CONFLICT);
        orderAt(student, LocalTime.NOON);
    }

    @Test
    void inTheFinalHourNoOrdersCanBePlaced() {
        Student student = askedAgo(newStudent(), Duration.ofHours(23).plusMinutes(30));

        assertThat(accountDeletion.status(student).orderingBlocked()).isTrue();
        assertRejected(() -> orderAt(student, LocalTime.NOON), HttpStatus.CONFLICT);
    }

    @Test
    void cancellingLiftsEveryLimit() {
        Student student = askedAgo(newStudent(), Duration.ofHours(23).plusMinutes(30));

        assertThat(accountDeletion.cancel(student.getId()).scheduledFor()).isNull();
        orderAt(student, LocalTime.of(12, 30));
    }

    @Test
    void afterTheGracePeriodTheAccountIsDeleted() {
        Student student = askedAgo(newStudent(), Duration.ofHours(24).plusMinutes(1));

        accountDeletion.deleteDueAccounts();

        assertThat(studentRepository.findById(student.getId())).isEmpty();
    }

    @Test
    void anAccountStillWithinItsGracePeriodIsKept() {
        Student student = askedAgo(newStudent(), Duration.ofHours(23));

        accountDeletion.deleteDueAccounts();

        assertThat(studentRepository.findById(student.getId())).isPresent();
    }

    @Test
    void aDueDeletionWaitsForALiveOrderToFinish() {
        Student student = newStudent();
        orderAt(student, LocalTime.NOON);
        askedAgo(student, Duration.ofHours(25));

        accountDeletion.deleteDueAccounts();

        assertThat(studentRepository.findById(student.getId())).isPresent();
    }

    @Test
    void aDeletedAccountsPastOrdersStayButAnonymised() {
        Student student = newStudent();
        Order order = orderAt(student, LocalTime.NOON);
        order.setStatus(OrderStatus.COMPLETED);
        orderRepository.saveAndFlush(order);
        askedAgo(student, Duration.ofHours(25));

        accountDeletion.deleteDueAccounts();

        Order kept = orderRepository.findById(order.getId()).orElseThrow();
        assertThat(kept.getCustomerName()).isEqualTo("Deleted student");
        assertThat(kept.getCustomerContact()).isEqualTo("(deleted)");
        assertThat(kept.getItems()).isNotEmpty();
    }

    @Test
    void aProtectedAccountGoesThroughTheFlowButIsNeverDeleted() {
        // The public demo login is protected by default (application.properties).
        Student demo = studentRepository.findByEmail("student@bennett.edu.in").orElseThrow();
        askedAgo(demo, Duration.ofHours(25));

        assertThat(accountDeletion.status(demo).protectedAccount()).isTrue();

        accountDeletion.deleteDueAccounts();

        Student kept = studentRepository.findById(demo.getId()).orElseThrow();
        assertThat(kept.getDeletionRequestedAt()).isNull();
    }
}
