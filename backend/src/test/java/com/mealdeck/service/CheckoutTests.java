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
import com.mealdeck.repository.StallRepository;
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

    private Stall stall(String name) {
        return stallRepository.findAllWithMenuItems().stream()
                .filter(s -> s.getName().equals(name)).findFirst().orElseThrow();
    }

    private static MenuItem item(Stall stall, String name) {
        return stall.getMenuItems().stream().filter(i -> i.getName().equals(name)).findFirst().orElseThrow();
    }

    private List<Order> checkout(String name, String contact, List<OrderItemRequest> items, Map<Long, LocalTime> times) {
        return orderService.checkout(new CreateOrderRequest(name, contact, items, times));
    }

    private Long orderAt(Stall stall) {
        MenuItem item = stall.getMenuItems().getFirst();
        return checkout("Test Student", "9999999999", List.of(new OrderItemRequest(item.getId(), 1)),
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

        List<Order> orders = checkout("  Asha  ", " 9876543210 ",
                List.of(new OrderItemRequest(roll.getId(), 2),
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
            assertThat(order.getCustomerName()).isEqualTo("Asha");
            assertThat(order.getCustomerContact()).isEqualTo("9876543210");
        });
    }

    @Test
    void secondStallWithoutAPickupTimeRejectsTheWholeCart() {
        Stall bistro = stall("Bistro / Kathi");
        Stall snapEats = stall("SnapEats");

        assertRejected(() -> checkout("Asha", "9876543210",
                List.of(new OrderItemRequest(bistro.getMenuItems().getFirst().getId(), 1),
                        new OrderItemRequest(snapEats.getMenuItems().getFirst().getId(), 1)),
                Map.of(bistro.getId(), NOON)), HttpStatus.BAD_REQUEST);
    }

    @Test
    void rejectsAnEmptyCart() {
        Long bistroId = stall("Bistro / Kathi").getId();

        assertRejected(() -> checkout("Asha", "9876543210", List.of(), Map.of(bistroId, NOON)), HttpStatus.BAD_REQUEST);
        assertRejected(() -> checkout("Asha", "9876543210", null, Map.of(bistroId, NOON)), HttpStatus.BAD_REQUEST);
    }

    @Test
    void requiresANameAndContact() {
        Stall bistro = stall("Bistro / Kathi");
        List<OrderItemRequest> cart = List.of(new OrderItemRequest(bistro.getMenuItems().getFirst().getId(), 1));
        Map<Long, LocalTime> times = Map.of(bistro.getId(), NOON);

        assertRejected(() -> checkout("   ", "9876543210", cart, times), HttpStatus.BAD_REQUEST);
        assertRejected(() -> checkout(null, "9876543210", cart, times), HttpStatus.BAD_REQUEST);
        assertRejected(() -> checkout("Asha", "", cart, times), HttpStatus.BAD_REQUEST);
        assertRejected(() -> checkout("Asha", null, cart, times), HttpStatus.BAD_REQUEST);
    }

    @Test
    void rejectsZeroAndNegativeQuantities() {
        Stall bistro = stall("Bistro / Kathi");
        Long itemId = bistro.getMenuItems().getFirst().getId();
        Map<Long, LocalTime> times = Map.of(bistro.getId(), NOON);

        assertRejected(() -> checkout("Asha", "9876543210", List.of(new OrderItemRequest(itemId, 0)), times), HttpStatus.BAD_REQUEST);
        assertRejected(() -> checkout("Asha", "9876543210", List.of(new OrderItemRequest(itemId, -2)), times), HttpStatus.BAD_REQUEST);
    }

    @Test
    void rejectsUnknownAndOutOfStockItems() {
        Stall bistro = stall("Bistro / Kathi");
        MenuItem roll = item(bistro, "Paneer Kathi Roll");
        Map<Long, LocalTime> times = Map.of(bistro.getId(), NOON);

        assertRejected(() -> checkout("Asha", "9876543210", List.of(new OrderItemRequest(999_999L, 1)), times), HttpStatus.BAD_REQUEST);

        roll.setAvailable(false);
        assertThatThrownBy(() -> checkout("Asha", "9876543210", List.of(new OrderItemRequest(roll.getId(), 1)), times))
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
