package com.mealdeck.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.mealdeck.FixedClockConfig;
import com.mealdeck.model.MenuItem;
import com.mealdeck.model.Order;
import com.mealdeck.model.OrderStatus;
import com.mealdeck.model.Stall;
import com.mealdeck.repository.StallRepository;
import com.mealdeck.web.OrderRequests.CreateOrderRequest;
import com.mealdeck.web.OrderRequests.OrderItemRequest;
import com.mealdeck.web.QueueSnapshot;
import com.mealdeck.web.QueueSnapshot.QueueOrder;
import com.mealdeck.web.SlotDto;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Runs against the demo profile's in-memory H2 and its seeded stalls, with
 * the campus clock pinned to 10:00 IST. Bistro / Kathi is seeded open
 * 08:00-20:00 with the default 15-minute slots. Each test rolls back, so
 * orders never leak between tests. */
@SpringBootTest
@ActiveProfiles("demo")
@Import(FixedClockConfig.class)
@Transactional
class PickupSlotTests {

    @Autowired
    OrderService orderService;

    @Autowired
    SlotService slotService;

    @Autowired
    QueueService queueService;

    @Autowired
    StallRepository stallRepository;

    @Autowired
    Clock clock;

    private Stall bistro() {
        return stallRepository.findAllWithMenuItems().stream()
                .filter(s -> s.getName().equals("Bistro / Kathi")).findFirst().orElseThrow();
    }

    private List<Order> order(Stall stall, String time) {
        MenuItem item = stall.getMenuItems().getFirst();
        return orderService.checkout(new CreateOrderRequest(
                "Test Student", "9999999999",
                List.of(new OrderItemRequest(item.getId(), 1)),
                Map.of(stall.getId(), LocalTime.parse(time))));
    }

    private static HttpStatus statusOf(Throwable e) {
        return HttpStatus.valueOf(((ResponseStatusException) e).getStatusCode().value());
    }

    @Test
    void listsOnlySlotsStillAheadOfNow() {
        List<LocalTime> slots = slotService.upcomingSlots(bistro());

        // 10:00 itself has started, so the first bookable slot is 10:15; the
        // last is 19:45 because it has to end by 20:00 closing.
        assertThat(slots.getFirst()).isEqualTo(LocalTime.of(10, 15));
        assertThat(slots.getLast()).isEqualTo(LocalTime.of(19, 45));
    }

    @Test
    void slotsSitOnTheQuarterHourEvenWhenHoursDont() {
        Stall stall = bistro();
        stall.setOpenTime(LocalTime.of(10, 10));
        stall.setCloseTime(LocalTime.of(11, 40));

        // Opening 10:10 rounds up to 10:15; 11:30 would end 11:45, after closing.
        assertThat(slotService.upcomingSlots(stall))
                .containsExactly(LocalTime.of(10, 15), LocalTime.of(10, 30), LocalTime.of(10, 45), LocalTime.of(11, 0), LocalTime.of(11, 15));
        // Checkout enforces the same grid: off the quarter hour, or on it but
        // running past closing, are both refused.
        assertThatThrownBy(() -> order(stall, "10:25"))
                .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.BAD_REQUEST));
        assertThatThrownBy(() -> order(stall, "11:30"))
                .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.BAD_REQUEST));
        assertThat(order(stall, "10:45")).hasSize(1);
    }

    @Test
    void slotRejectsOrdersPastCapacity() {
        Stall stall = bistro();
        stall.setSlotCapacity(3);
        for (int i = 0; i < 3; i++) {
            order(stall, "12:30");
        }

        assertThatThrownBy(() -> order(stall, "12:30"))
                .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.CONFLICT))
                .hasMessageContaining("12:30 slot at Bistro / Kathi just filled up");
        // Other slots are unaffected.
        assertThat(order(stall, "12:45")).hasSize(1);
    }

    @Test
    void cancelledOrdersFreeTheirSpot() {
        Stall stall = bistro();
        stall.setSlotCapacity(1);
        Long first = order(stall, "13:00").getFirst().getId();
        assertThatThrownBy(() -> order(stall, "13:00"))
                .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.CONFLICT));

        orderService.advanceStatus(stall.getId(), first, OrderStatus.CANCELLED);

        assertThat(order(stall, "13:00")).hasSize(1);
    }

    @Test
    void slotListReportsBookedAndFull() {
        Stall stall = bistro();
        stall.setSlotCapacity(2);
        order(stall, "11:00");
        order(stall, "11:00");
        order(stall, "11:15");

        Map<LocalTime, SlotDto> slots = queueService.slots(stall.getId()).stream()
                .collect(Collectors.toMap(SlotDto::time, slot -> slot));
        assertThat(slots.get(LocalTime.of(11, 0))).isEqualTo(new SlotDto(LocalTime.of(11, 0), 2, 2, true));
        assertThat(slots.get(LocalTime.of(11, 15))).isEqualTo(new SlotDto(LocalTime.of(11, 15), 1, 2, false));
        assertThat(slots.get(LocalTime.of(11, 30))).isEqualTo(new SlotDto(LocalTime.of(11, 30), 0, 2, false));
    }

    @Test
    void queueCountsUnfinishedOrdersAheadInPickupOrder() {
        Stall stall = bistro();
        Long late = order(stall, "15:00").getFirst().getId();
        Long early = order(stall, "11:00").getFirst().getId();
        Long sameSlotLater = order(stall, "11:00").getFirst().getId();
        Long done = order(stall, "10:30").getFirst().getId();
        orderService.advanceStatus(stall.getId(), done, OrderStatus.CANCELLED);

        QueueSnapshot queue = queueService.snapshot(stall.getId());

        // The cancelled 10:30 order has left the queue and counts for nobody.
        assertThat(queue.orders()).extracting(QueueOrder::id).containsExactly(early, sameSlotLater, late);
        assertThat(queue.orders()).extracting(QueueOrder::ahead).containsExactly(0, 1, 2);
    }

    @Test
    void queueSnapshotNeverCarriesCustomerDetails() {
        // The topic is public: guard against someone adding name/contact
        // to the record later.
        assertThat(QueueOrder.class.getRecordComponents())
                .extracting(java.lang.reflect.RecordComponent::getName)
                .doesNotContain("customerName", "customerContact");
    }

    @Test
    void readyOrderBecomesNoShowOnlyAfterFifteenMinutes() {
        Stall stall = bistro();
        Long id = order(stall, "10:15").getFirst().getId();
        orderService.advanceStatus(stall.getId(), id, OrderStatus.ACCEPTED);
        Order ready = orderService.advanceStatus(stall.getId(), id, OrderStatus.READY);
        assertThat(ready.getReadyAt()).isEqualTo(Instant.now(clock));

        // The job compares against the pinned clock, so move readyAt back
        // instead of moving time forward.
        ready.setReadyAt(Instant.now(clock).minus(Duration.ofMinutes(14)));
        assertThat(orderService.expireUncollected()).isZero();
        assertThat(orderService.getOrder(id).getStatus()).isEqualTo(OrderStatus.READY);

        orderService.getOrder(id).setReadyAt(Instant.now(clock).minus(Duration.ofMinutes(16)));
        assertThat(orderService.expireUncollected()).isEqualTo(1);
        assertThat(orderService.getOrder(id).getStatus()).isEqualTo(OrderStatus.NO_SHOW);
    }

    @Test
    void noShowTimerLeavesUnreadyAndCollectedOrdersAlone() {
        Stall stall = bistro();
        Long placed = order(stall, "10:30").getFirst().getId();
        Long collected = order(stall, "10:30").getFirst().getId();
        orderService.advanceStatus(stall.getId(), collected, OrderStatus.ACCEPTED);
        orderService.advanceStatus(stall.getId(), collected, OrderStatus.READY);
        orderService.advanceStatus(stall.getId(), collected, OrderStatus.COMPLETED)
                .setReadyAt(Instant.now(clock).minus(Duration.ofHours(1)));

        orderService.expireUncollected();

        assertThat(orderService.getOrder(placed).getStatus()).isEqualTo(OrderStatus.PLACED);
        assertThat(orderService.getOrder(collected).getStatus()).isEqualTo(OrderStatus.COMPLETED);
    }

    @Test
    void rejectsSlotsThatAlreadyStarted() {
        // 10:00 is exactly now: a slot that starts this minute has started.
        assertThatThrownBy(() -> order(bistro(), "10:00"))
                .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void rejectsCheckoutWithoutAPickupTime() {
        Stall stall = bistro();
        MenuItem item = stall.getMenuItems().getFirst();

        assertThatThrownBy(() -> orderService.checkout(new CreateOrderRequest(
                "Test Student", "9999999999", List.of(new OrderItemRequest(item.getId(), 1)), Map.of())))
                .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    void closedStallHasNoSlots() {
        Stall stall = bistro();
        stall.setClosedToday(true);

        assertThat(slotService.upcomingSlots(stall)).isEmpty();
        assertThatThrownBy(() -> order(stall, "12:00"))
                .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void vendorSeesTodaysOrdersInPickupOrder() {
        Stall stall = bistro();
        order(stall, "15:00");
        order(stall, "11:00");

        assertThat(orderService.todaysOrdersForStall(stall.getId()))
                .extracting(Order::getPickupTime)
                .containsExactly(LocalTime.of(11, 0), LocalTime.of(15, 0));
    }

    @Test
    void readyOrderCanEndAsNoShowThenStillBePickedUp() {
        Stall stall = bistro();
        Long id = order(stall, "16:00").getFirst().getId();
        orderService.advanceStatus(stall.getId(), id, OrderStatus.ACCEPTED);
        orderService.advanceStatus(stall.getId(), id, OrderStatus.READY);

        assertThat(orderService.advanceStatus(stall.getId(), id, OrderStatus.NO_SHOW).getStatus())
                .isEqualTo(OrderStatus.NO_SHOW);
        assertThatThrownBy(() -> orderService.advanceStatus(stall.getId(), id, OrderStatus.CANCELLED))
                .satisfies(e -> assertThat(statusOf(e)).isEqualTo(HttpStatus.BAD_REQUEST));
        // A late student turns up after the timer fired.
        assertThat(orderService.advanceStatus(stall.getId(), id, OrderStatus.COMPLETED).getStatus())
                .isEqualTo(OrderStatus.COMPLETED);
    }
}
