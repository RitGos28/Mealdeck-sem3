package com.mealdeck.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.mealdeck.FixedClockConfig;
import com.mealdeck.model.MenuItem;
import com.mealdeck.model.Order;
import com.mealdeck.model.OrderStatus;
import com.mealdeck.model.Stall;
import com.mealdeck.model.Student;
import com.mealdeck.repository.OrderRepository;
import com.mealdeck.repository.StallRepository;
import com.mealdeck.repository.StudentRepository;
import com.mealdeck.web.OrderRequests.CreateOrderRequest;
import com.mealdeck.web.OrderRequests.OrderItemRequest;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** No-show limits that survive deleting the account, + aliases, and the
 * admin's "suspicious emails" flags. */
@SpringBootTest
@ActiveProfiles("demo")
@Import(FixedClockConfig.class)
@Transactional
class EmailStandingTests {

    @Autowired EmailStandingService emailStanding;
    @Autowired OrderService orderService;
    @Autowired StudentService studentService;
    @Autowired SignupCodeService signupCodeService;
    @Autowired StudentRepository studentRepository;
    @Autowired StallRepository stallRepository;
    @Autowired OrderRepository orderRepository;
    @Autowired jakarta.persistence.EntityManager em;

    private static final String EMAIL = "prankster@bennett.edu.in";

    private Student student() {
        return studentRepository.save(new Student(EMAIL, "unused", "Prank Ster", null));
    }

    private Order orderAs(Student student) {
        Stall stall = stallRepository.findAllWithMenuItems().stream().filter(s -> s.getName().equals("Bistro / Kathi")).findFirst().orElseThrow();
        MenuItem item = stall.getMenuItems().getFirst();
        return orderService.checkout(student.getId(), new CreateOrderRequest(List.of(new OrderItemRequest(item.getId(), 1)), Map.of(stall.getId(), LocalTime.NOON))).getFirst();
    }

    private void noShow(Order order) {
        order.setStatus(OrderStatus.NO_SHOW);
        orderRepository.saveAndFlush(order);
    }

    private static void assertRejected(ThrowingCallable call, HttpStatus status) {
        assertThatThrownBy(call).isInstanceOfSatisfying(ResponseStatusException.class,
                e -> assertThat(e.getStatusCode().value()).isEqualTo(status.value()));
    }

    @Test
    void plusAliasesAreRefused() {
        assertThat(EmailDomains.isStudentEmail("asha+1@bennett.edu.in")).isFalse();
        assertThat(EmailDomains.studentEmailProblem("asha+1@bennett.edu.in")).contains("without a + part");
        assertRejected(() -> signupCodeService.requestCode("asha+2@bennett.edu.in"), HttpStatus.BAD_REQUEST);
    }

    @Test
    void twoNoShowsPausePreOrdering() {
        Student student = student();
        noShow(orderAs(student));
        orderAs(student);  // one no-show: still fine
        noShow(orderRepository.findAll().stream().filter(o -> EMAIL.equals(o.getCustomerContact()) && o.getStatus() == OrderStatus.PLACED).findFirst().orElseThrow());

        assertRejected(() -> orderAs(student), HttpStatus.CONFLICT);
    }

    @Test
    void deletingTheAccountAndSigningUpAgainDoesNotResetIt() {
        Student first = student();
        noShow(orderAs(first));
        noShow(orderAs(first));
        studentService.deleteByAdmin(first.getId());
        em.flush();  // in real life the re-sign-up is a separate, later transaction

        Student again = student();
        assertRejected(() -> orderAs(again), HttpStatus.CONFLICT);
    }

    @Test
    void pickedUpLateDoesNotCount() {
        Student student = student();
        Order late = orderAs(student);
        noShow(late);
        late.setStatus(OrderStatus.COMPLETED);
        orderRepository.saveAndFlush(late);
        noShow(orderAs(student));

        orderAs(student);  // only one still a no-show
    }

    @Test
    void aFlaggedEmailCanNeitherOrderNorSignUpUntilUnflagged() {
        Student student = student();
        var entry = emailStanding.flag(EMAIL, "Prank orders at two stalls", null);
        assertThat(entry.hint()).isEqualTo("pr•••@bennett.edu.in");

        assertRejected(() -> orderAs(student), HttpStatus.CONFLICT);
        assertRejected(() -> emailStanding.requireCanSignUp(EMAIL), HttpStatus.FORBIDDEN);

        emailStanding.unflag(entry.id());
        orderAs(student);
    }

    @Test
    void emailCodesAreWipedOnceOrdersAreOlderThanTheWindow() {
        Order order = orderAs(student());
        assertThat(order.getCustomerEmailKey()).isNotBlank();
        em.createQuery("update Order o set o.pickupDate = :day where o.id = :id")
                .setParameter("day", order.getPickupDate().minusDays(31)).setParameter("id", order.getId()).executeUpdate();
        em.clear();

        emailStanding.forgetOldEmailKeys();

        assertThat(orderRepository.findById(order.getId()).orElseThrow().getCustomerEmailKey()).isNull();
    }
}
