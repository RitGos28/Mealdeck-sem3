package com.mealdeck.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

import com.mealdeck.FixedClockConfig;
import com.mealdeck.model.MenuItem;
import com.mealdeck.model.Stall;
import com.mealdeck.repository.OrderRepository;
import com.mealdeck.repository.StallRepository;
import com.mealdeck.web.OrderRequests.CreateOrderRequest;
import com.mealdeck.web.OrderRequests.OrderItemRequest;
import com.mealdeck.web.QueueBroadcaster;
import com.mealdeck.web.QueueSnapshot;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.web.server.ResponseStatusException;

/** Behaviour that only shows up once a transaction really commits (the
 * after-commit push, the slot lock), so unlike PickupSlotTests these tests
 * aren't @Transactional and clean up after themselves instead. Same pinned
 * 10:00 IST clock and seeded Bistro / Kathi stall. */
@SpringBootTest
@ActiveProfiles("demo")
@Import(FixedClockConfig.class)
class LiveQueueTests {

    @MockitoBean
    SimpMessagingTemplate messaging;

    @Autowired
    OrderService orderService;

    @Autowired
    StallRepository stallRepository;

    @Autowired
    OrderRepository orderRepository;

    @AfterEach
    void cleanUp() {
        orderRepository.deleteAll();
        Stall stall = bistro();
        stall.setSlotCapacity(null);
        stallRepository.save(stall);
    }

    private Stall bistro() {
        return stallRepository.findAllWithMenuItems().stream()
                .filter(s -> s.getName().equals("Bistro / Kathi")).findFirst().orElseThrow();
    }

    private Long order(Stall stall, String time) {
        MenuItem item = stall.getMenuItems().getFirst();
        return orderService.checkout(new CreateOrderRequest(
                "Test Student", "9999999999",
                List.of(new OrderItemRequest(item.getId(), 1)),
                Map.of(stall.getId(), LocalTime.parse(time)))).getFirst().getId();
    }

    @Test
    void checkoutPushesTheStallsNewQueueAfterCommit() {
        Stall stall = bistro();
        Long id = order(stall, "12:00");

        ArgumentCaptor<QueueSnapshot> pushed = ArgumentCaptor.forClass(QueueSnapshot.class);
        verify(messaging).convertAndSend(eq(QueueBroadcaster.topic(stall.getId())), pushed.capture());
        assertThat(pushed.getValue().orders()).extracting(QueueSnapshot.QueueOrder::id).containsExactly(id);
        assertThat(pushed.getValue().slots())
                .filteredOn(slot -> slot.time().equals(LocalTime.of(12, 0)))
                .singleElement()
                .satisfies(slot -> assertThat(slot.booked()).isEqualTo(1));
    }

    @Test
    void twoStudentsRacingForTheLastSpotCantBothGetIt() throws Exception {
        Stall stall = bistro();
        stall.setSlotCapacity(1);
        stallRepository.save(stall);

        CountDownLatch start = new CountDownLatch(1);
        Callable<Boolean> attempt = () -> {
            start.await();
            try {
                order(stall, "14:00");
                return true;
            } catch (ResponseStatusException e) {
                return false;
            }
        };
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            List<Future<Boolean>> results = new ArrayList<>();
            results.add(pool.submit(attempt));
            results.add(pool.submit(attempt));
            start.countDown();

            List<Boolean> outcomes = new ArrayList<>();
            for (Future<Boolean> result : results) {
                outcomes.add(result.get());
            }
            assertThat(outcomes).containsExactlyInAnyOrder(true, false);
            assertThat(orderRepository.count()).isEqualTo(1);
        } finally {
            pool.shutdownNow();
        }
    }
}
