package com.mealdeck.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;

import com.mealdeck.FixedClockConfig;
import com.mealdeck.model.MenuItem;
import com.mealdeck.model.Order;
import com.mealdeck.model.OrderItem;
import com.mealdeck.model.OrderStatus;
import com.mealdeck.model.Stall;
import com.mealdeck.model.Student;
import com.mealdeck.repository.StallRepository;
import com.mealdeck.repository.OrderRepository;
import com.mealdeck.repository.StudentRepository;
import com.mealdeck.web.OrderRequests.CreateOrderRequest;
import com.mealdeck.web.OrderRequests.OrderItemRequest;
import java.time.LocalDate;
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

/** Cart validation, the per-stall split, and the vendor stall scoping on
 * orders. Same pinned 10:00 IST clock and seeded stalls as PickupSlotTests,
 * and the same rollback per test. */
@SpringBootTest
@ActiveProfiles("demo")
@Import(FixedClockConfig.class)
@Transactional
class CheckoutTests {

    private static final LocalTime NOON = LocalTime.of(12, 0);

    @Autowired
    OrderService orderService;

    @Autowired
    StallRepository stallRepository;

    @Autowired
    StudentRepository studentRepository;

    @Autowired
    StudentService studentService;

    @Autowired
    OrderRepository orderRepository;

    @Autowired
    java.time.Clock clock;

    /** Orders are placed as the student DemoDataSeeder creates. */
    private Long studentId() {
        return studentRepository.findByEmail("student@bennett.edu.in").orElseThrow().getId();
    }

    private Stall stall(String name) {
        return stallRepository.findAllWithMenuItems().stream()
                .filter(s -> s.getName().equals(name)).findFirst().orElseThrow();
    }

    private static MenuItem item(Stall stall, String name) {
        return stall.getMenuItems().stream().filter(i -> i.getName().equals(name)).findFirst().orElseThrow();
    }

    private List<Order> checkout(List<OrderItemRequest> items, Map<Long, LocalTime> times) {
        return orderService.checkout(studentId(), new CreateOrderRequest(items, times));
    }

    private Long orderAt(Stall stall) {
        MenuItem item = stall.getMenuItems().getFirst();
        return checkout(List.of(new OrderItemRequest(item.getId(), 1)),
                Map.of(stall.getId(), NOON)).getFirst().getId();
    }

    private static void assertRejected(ThrowingCallable call, HttpStatus status) {
        assertThatThrownBy(call).isInstanceOfSatisfying(ResponseStatusException.class,
                e -> assertThat(e.getStatusCode().value()).isEqualTo(status.value()));
    }

    @Test
    void cartSpanningTwoStallsBecomesOneOrderPerStallEachWithItsOwnSlot() {
        Stall bistro = stall("Bistro / Kathi");
        Stall snapEats = stall("SnapEats");
        MenuItem roll = item(bistro, "Paneer Kathi Roll");
        MenuItem sandwich = item(bistro, "Veg Sandwich");
        MenuItem coffee = item(snapEats, "Cold Coffee");

        List<Order> orders = checkout(List.of(new OrderItemRequest(roll.getId(), 2),
                        new OrderItemRequest(coffee.getId(), 1),
                        new OrderItemRequest(sandwich.getId(), 1)),
                Map.of(bistro.getId(), LocalTime.of(12, 30), snapEats.getId(), LocalTime.of(13, 0)));

        assertThat(orders).hasSize(2);
        Order bistroOrder = orders.stream().filter(o -> o.getStall().getId().equals(bistro.getId())).findFirst().orElseThrow();
        Order snapOrder = orders.stream().filter(o -> o.getStall().getId().equals(snapEats.getId())).findFirst().orElseThrow();

        assertThat(bistroOrder.getPickupTime()).isEqualTo(LocalTime.of(12, 30));
        assertThat(bistroOrder.getItems()).extracting(i -> i.getMenuItem().getName(), OrderItem::getQuantity)
                .containsExactlyInAnyOrder(
                        tuple("Paneer Kathi Roll", 2),
                        tuple("Veg Sandwich", 1));
        assertThat(snapOrder.getPickupTime()).isEqualTo(LocalTime.of(13, 0));
        assertThat(snapOrder.getItems()).extracting(i -> i.getMenuItem().getName()).containsExactly("Cold Coffee");

        assertThat(orders).allSatisfy(order -> {
            assertThat(order.getStatus()).isEqualTo(OrderStatus.PLACED);
            assertThat(order.getCustomerName()).isEqualTo("Demo Student");
        });
    }

    @Test
    void secondStallWithoutAPickupTimeRejectsTheWholeCart() {
        Stall bistro = stall("Bistro / Kathi");
        Stall snapEats = stall("SnapEats");

        assertRejected(() -> checkout(List.of(new OrderItemRequest(bistro.getMenuItems().getFirst().getId(), 1),
                        new OrderItemRequest(snapEats.getMenuItems().getFirst().getId(), 1)),
                Map.of(bistro.getId(), NOON)), HttpStatus.BAD_REQUEST);
    }

    @Test
    void rejectsAnEmptyCart() {
        Long bistroId = stall("Bistro / Kathi").getId();

        assertRejected(() -> checkout(List.of(), Map.of(bistroId, NOON)), HttpStatus.BAD_REQUEST);
        assertRejected(() -> checkout(null, Map.of(bistroId, NOON)), HttpStatus.BAD_REQUEST);
    }

    @Test
    void nameAndContactComeFromTheStudentsAccount() {
        Stall bistro = stall("Bistro / Kathi");
        List<OrderItemRequest> cart = List.of(new OrderItemRequest(bistro.getMenuItems().getFirst().getId(), 1));

        // No phone on the account: the Bennett email is the contact.
        Order withoutPhone = checkout(cart, Map.of(bistro.getId(), NOON)).getFirst();
        assertThat(withoutPhone.getCustomerName()).isEqualTo("Demo Student");
        assertThat(withoutPhone.getCustomerContact()).isEqualTo("student@bennett.edu.in");
        assertThat(withoutPhone.getStudent().getId()).isEqualTo(studentId());

        Student withPhone = studentRepository.save(new Student("phone.owner@bennett.edu.in", "unused", "Phone Owner", "9876543210"));
        Order order = orderService.checkout(withPhone.getId(), new CreateOrderRequest(cart, Map.of(bistro.getId(), NOON))).getFirst();
        assertThat(order.getCustomerName()).isEqualTo("Phone Owner");
        assertThat(order.getCustomerContact()).isEqualTo("9876543210");
    }

    @Test
    void deletingAStudentKeepsTheirOrdersOnTheVendorsListAnonymised() {
        Stall bistro = stall("Bistro / Kathi");
        Student leaver = studentRepository.save(new Student("leaver@bennett.edu.in", "unused", "Leaver", null));
        Long orderId = orderService.checkout(leaver.getId(), new CreateOrderRequest(
                List.of(new OrderItemRequest(bistro.getMenuItems().getFirst().getId(), 1)), Map.of(bistro.getId(), NOON))).getFirst().getId();

        studentService.deleteByAdmin(leaver.getId());

        Order kept = orderService.getOrder(orderId);
        assertThat(kept.getStudent()).isNull();
        assertThat(kept.getCustomerName()).isEqualTo("Deleted student");
        assertThat(kept.getCustomerContact()).isEqualTo("(deleted)");
        assertThat(kept.getItems()).isNotEmpty();
    }

    @Test
    void eachOrderGetsItsOwnTwelveCharacterCode() {
        Order first = orderService.getOrder(orderAt(stall("Bistro / Kathi")));
        Order second = orderService.getOrder(orderAt(stall("Bistro / Kathi")));

        assertThat(first.getPublicCode()).matches("[2-9A-HJKMNP-Z]{12}");
        assertThat(second.getPublicCode()).matches("[2-9A-HJKMNP-Z]{12}").isNotEqualTo(first.getPublicCode());
        assertThat(orderService.getOrderByCode(first.getPublicCode()).getId()).isEqualTo(first.getId());
        assertRejected(() -> orderService.getOrderByCode("ZZZZZZZZZZZZ"), HttpStatus.NOT_FOUND);
        assertRejected(() -> orderService.getOrderByCode(String.valueOf(first.getId())), HttpStatus.NOT_FOUND);
    }

    @Test
    void ordersFromBeforeCodesGetOneAtStartup() {
        Order old = orderService.getOrder(orderAt(stall("Bistro / Kathi")));
        old.setPublicCode(null);
        orderRepository.saveAndFlush(old);

        assertThat(orderService.fillMissingCodes()).isEqualTo(1);
        assertThat(orderService.getOrder(old.getId()).getPublicCode()).matches("[2-9A-HJKMNP-Z]{12}");
        assertThat(orderService.fillMissingCodes()).isZero();
    }

    @Test
    void orderHistoryShowsOneDayAtATimeForTheVendorsOwnStall() {
        Stall bistro = stall("Bistro / Kathi");
        Stall snapEats = stall("SnapEats");
        LocalDate today = LocalDate.now(clock);
        Student student = studentRepository.findById(studentId()).orElseThrow();
        Order yesterdays = orderRepository.save(new Order(bistro, student, today.minusDays(1), NOON));
        orderRepository.save(new Order(snapEats, student, today.minusDays(1), NOON));
        Long todays = orderAt(bistro);

        assertThat(orderService.ordersForStallOn(bistro.getId(), today.minusDays(1))).extracting(Order::getId).containsExactly(yesterdays.getId());
        assertThat(orderService.ordersForStallOn(bistro.getId(), today)).extracting(Order::getId).containsExactly(todays);
        assertThat(orderService.ordersForStallOn(bistro.getId(), today.minusDays(30))).isEmpty();
        assertRejected(() -> orderService.ordersForStallOn(bistro.getId(), today.plusDays(1)), HttpStatus.BAD_REQUEST);
    }

    @Test
    void anUnknownStudentCantOrder() {
        Stall bistro = stall("Bistro / Kathi");

        assertRejected(() -> orderService.checkout(-1L, new CreateOrderRequest(
                List.of(new OrderItemRequest(bistro.getMenuItems().getFirst().getId(), 1)), Map.of(bistro.getId(), NOON))),
                HttpStatus.FORBIDDEN);
    }

    @Test
    void rejectsZeroAndNegativeQuantities() {
        Stall bistro = stall("Bistro / Kathi");
        Long itemId = bistro.getMenuItems().getFirst().getId();
        Map<Long, LocalTime> times = Map.of(bistro.getId(), NOON);

        assertRejected(() -> checkout(List.of(new OrderItemRequest(itemId, 0)), times), HttpStatus.BAD_REQUEST);
        assertRejected(() -> checkout(List.of(new OrderItemRequest(itemId, -2)), times), HttpStatus.BAD_REQUEST);
    }

    @Test
    void rejectsUnknownAndOutOfStockItems() {
        Stall bistro = stall("Bistro / Kathi");
        MenuItem roll = item(bistro, "Paneer Kathi Roll");
        Map<Long, LocalTime> times = Map.of(bistro.getId(), NOON);

        assertRejected(() -> checkout(List.of(new OrderItemRequest(999_999L, 1)), times), HttpStatus.BAD_REQUEST);

        roll.setAvailable(false);
        assertThatThrownBy(() -> checkout(List.of(new OrderItemRequest(roll.getId(), 1)), times))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Paneer Kathi Roll is out of stock");
    }

    @Test
    void vendorCantAdvanceAnotherStallsOrder() {
        Stall bistro = stall("Bistro / Kathi");
        Stall snapEats = stall("SnapEats");
        Long snapOrder = orderAt(snapEats);

        assertRejected(() -> orderService.advanceStatus(bistro.getId(), snapOrder, OrderStatus.ACCEPTED), HttpStatus.FORBIDDEN);
        assertRejected(() -> orderService.advanceStatus(bistro.getId(), snapOrder, OrderStatus.CANCELLED), HttpStatus.FORBIDDEN);
        assertThat(orderService.getOrder(snapOrder).getStatus()).isEqualTo(OrderStatus.PLACED);
    }

    @Test
    void vendorsOrderListOnlyHoldsTheirOwnStall() {
        Stall bistro = stall("Bistro / Kathi");
        Stall snapEats = stall("SnapEats");
        Long bistroOrder = orderAt(bistro);
        Long snapOrder = orderAt(snapEats);

        assertThat(orderService.todaysOrdersForStall(bistro.getId())).extracting(Order::getId).containsExactly(bistroOrder);
        assertThat(orderService.todaysOrdersForStall(snapEats.getId())).extracting(Order::getId).containsExactly(snapOrder);
    }

    @Test
    void advancingAnUnknownOrderIsNotFound() {
        assertRejected(() -> orderService.advanceStatus(stall("Bistro / Kathi").getId(), 999_999L, OrderStatus.ACCEPTED),
                HttpStatus.NOT_FOUND);
    }
}
