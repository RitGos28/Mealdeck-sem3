package com.mealdeck.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.mealdeck.FixedClockConfig;
import com.mealdeck.model.MenuItem;
import com.mealdeck.model.Stall;
import com.mealdeck.model.Student;
import com.mealdeck.repository.MenuItemRepository;
import com.mealdeck.repository.StallRepository;
import com.mealdeck.repository.StudentRepository;
import com.mealdeck.service.EtaService.BasketLine;
import com.mealdeck.web.OrderRequests.CreateOrderRequest;
import com.mealdeck.web.OrderRequests.OrderItemRequest;
import java.time.Clock;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/** The demo profile's seeded stalls, with the clock pinned to 10:00 IST on
 * Tuesday 2026-09-29. The Python model is replaced by a stub that records
 * what it was asked, so these tests check the features sent to it. */
@SpringBootTest
@ActiveProfiles("demo")
@Import(FixedClockConfig.class)
@Transactional
class EtaServiceTests {

    @Autowired
    EtaService etaService;

    @Autowired
    MenuItemRepository menuItemRepository;

    @Autowired
    QueueService queueService;

    @Autowired
    OrderService orderService;

    @Autowired
    StallRepository stallRepository;

    @Autowired
    StudentRepository studentRepository;

    @Autowired
    Clock clock;

    @Autowired
    HotService hotService;

    /** Answers every query with 9.5 minutes and remembers it. */
    static class StubModel implements EtaModelClient {
        final List<Query> queries = new ArrayList<>();
        boolean down;

        @Override
        public Optional<Prediction> predict(Query query) {
            queries.add(query);
            return down ? Optional.empty() : Optional.of(new Prediction(9.5, 8.0, 11.0, true));
        }
    }

    private final StubModel model = new StubModel();

    private EtaService enabled() {
        return new EtaService(menuItemRepository, stallRepository, hotService, queueService, clock, model, true);
    }

    private Stall stall(String name) {
        return stallRepository.findAllWithMenuItems().stream()
                .filter(s -> s.getName().equals(name)).findFirst().orElseThrow();
    }

    private MenuItem dish(Stall stall, String name) {
        return stall.getMenuItems().stream().filter(item -> item.getName().equals(name)).findFirst().orElseThrow();
    }

    /** One order from a fresh student, so the per-student open-order cap
     * never gets in the way. */
    private void order(Stall stall, String time) {
        Long someone = studentRepository.save(new Student(
                "eta" + System.nanoTime() + "@bennett.edu.in", "x", "ETA Test", null)).getId();
        orderService.checkout(someone, new CreateOrderRequest(
                List.of(new OrderItemRequest(stall.getMenuItems().getFirst().getId(), 1)),
                Map.of(stall.getId(), LocalTime.parse(time))));
    }

    @Test
    void offByDefaultSoNoEstimateIsGiven() {
        Stall bistro = stall("Bistro / Kathi");
        List<BasketLine> basket = List.of(new BasketLine(dish(bistro, "Veg Sandwich").getId(), 1));

        assertThat(etaService.estimate(bistro.getId(), basket, null)).isEmpty();
    }

    @Test
    void sendsTheBasketQueueAndSlotToTheModel() {
        Stall bistro = stall("Bistro / Kathi");
        order(bistro, "10:30");
        order(bistro, "10:30");
        order(bistro, "11:00");
        MenuItem roll = dish(bistro, "Paneer Kathi Roll");
        List<BasketLine> basket = List.of(
                new BasketLine(roll.getId(), 1),
                new BasketLine(roll.getId(), 1),
                new BasketLine(dish(bistro, "Veg Sandwich").getId(), 1));

        Optional<EtaModelClient.Prediction> estimate = enabled().estimate(bistro.getId(), basket, LocalTime.of(10, 30));

        assertThat(estimate).map(EtaModelClient.Prediction::minutes).contains(9.5);
        EtaModelClient.Query query = model.queries.getFirst();
        assertThat(query.items()).containsExactly(
                new EtaModelClient.Line("Paneer Kathi Roll", null, 2),
                new EtaModelClient.Line("Veg Sandwich", null, 1));
        assertThat(query.hour()).isEqualTo(10);
        assertThat(query.weekday()).isEqualTo(1);
        // The two 10:30 orders come first; the 11:00 one is behind.
        assertThat(query.ordersAhead()).isEqualTo(2);
        assertThat(query.slotLoad()).isEqualTo(2);
    }

    @Test
    void withoutAPickupTimeTheWholeQueueIsAheadAtTheCurrentHour() {
        Stall bistro = stall("Bistro / Kathi");
        order(bistro, "10:30");
        order(bistro, "12:00");

        enabled().estimate(bistro.getId(), List.of(new BasketLine(dish(bistro, "Veg Sandwich").getId(), 1)), null);

        EtaModelClient.Query query = model.queries.getFirst();
        assertThat(query.ordersAhead()).isEqualTo(2);
        assertThat(query.slotLoad()).isZero();
        assertThat(query.hour()).isEqualTo(10);
    }

    @Test
    void dishesFromAnotherStallAreIgnored() {
        Stall bistro = stall("Bistro / Kathi");
        List<BasketLine> basket = List.of(new BasketLine(dish(stall("Quench"), "Oreo Shake").getId(), 1));

        assertThat(enabled().estimate(bistro.getId(), basket, null)).isEmpty();
        assertThat(model.queries).isEmpty();
    }

    @Test
    void anUnreachableModelMeansNoEstimate() {
        Stall bistro = stall("Bistro / Kathi");
        model.down = true;

        assertThat(enabled().estimate(bistro.getId(),
                List.of(new BasketLine(dish(bistro, "Veg Sandwich").getId(), 1)), null)).isEmpty();
    }
}
