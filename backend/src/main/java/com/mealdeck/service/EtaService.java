package com.mealdeck.service;

import com.mealdeck.model.MenuItem;
import com.mealdeck.model.Stall;
import com.mealdeck.repository.MenuItemRepository;
import com.mealdeck.repository.StallRepository;
import com.mealdeck.web.QueueSnapshot;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** A preparation-time estimate for a basket at one stall, from the ML model
 * in ml/. Off unless mealdeck.ml.eta.enabled is true: the model is trained
 * on simulated orders, so it's for local demos, and real students never see
 * an invented estimate. */
@Service
public class EtaService {

    /** The most portions of one dish the model is asked about. */
    static final int MAX_QUANTITY = 50;

    private final MenuItemRepository menuItemRepository;
    private final StallRepository stallRepository;
    private final HotService hotService;
    private final QueueService queueService;
    private final Clock clock;
    private final EtaModelClient model;
    private final boolean enabled;

    public EtaService(
            MenuItemRepository menuItemRepository,
            StallRepository stallRepository,
            HotService hotService,
            QueueService queueService,
            Clock clock,
            EtaModelClient model,
            @Value("${mealdeck.ml.eta.enabled:false}") boolean enabled) {
        this.menuItemRepository = menuItemRepository;
        this.stallRepository = stallRepository;
        this.hotService = hotService;
        this.queueService = queueService;
        this.clock = clock;
        this.model = model;
        this.enabled = enabled;
    }

    /** One line of the basket, as the checkout sends it. */
    public record BasketLine(Long menuItemId, int quantity) {
    }

    /** Empty when estimates are off, the basket has nothing from this stall,
     * or the model doesn't answer. pickupTime is the chosen slot; without
     * one, the whole current queue counts as ahead. */
    @Transactional(readOnly = true)
    public Optional<EtaModelClient.Prediction> estimate(Long stallId, List<BasketLine> basket, LocalTime pickupTime) {
        if (!enabled || basket == null || basket.isEmpty()) {
            return Optional.empty();
        }
        // The same dish can sit on several lines (different choices).
        Map<Long, Integer> quantities = new LinkedHashMap<>();
        for (BasketLine line : basket) {
            if (line != null && line.menuItemId() != null && line.quantity() > 0) {
                quantities.merge(line.menuItemId(), line.quantity(), Integer::sum);
            }
        }
        List<EtaModelClient.Line> items = menuItemRepository.findAllById(quantities.keySet()).stream()
                .filter(item -> item.getStall().getId().equals(stallId))
                .map(item -> line(item, quantities.get(item.getId())))
                .toList();
        if (items.isEmpty()) {
            return Optional.empty();
        }

        QueueSnapshot queue = queueService.snapshot(stallId);
        int ordersAhead = (int) queue.orders().stream()
                .filter(order -> pickupTime == null || order.pickupTime() == null || !order.pickupTime().isAfter(pickupTime))
                .count();
        int slotLoad = queue.slots().stream()
                .filter(slot -> slot.time().equals(pickupTime))
                .mapToInt(slot -> (int) slot.booked())
                .findFirst()
                .orElse(0);
        int hour = (pickupTime != null ? pickupTime : LocalTime.now(clock)).getHour();
        int weekday = LocalDate.now(clock).getDayOfWeek().getValue() - 1;
        return model.predict(new EtaModelClient.Query(items, hour, weekday, ordersAhead, slotLoad));
    }

    /** A stall's estimate for a new one-dish order of its most-ordered dish
     * this week (or its first available dish), with today's queue. */
    public record StallWait(Long stallId, double minutes, boolean simulated) {
    }

    /** "About 14 min at Quench" for every stall taking pre-orders right now.
     * Empty when estimates are off. */
    @Transactional(readOnly = true)
    public List<StallWait> stallWaits() {
        if (!enabled) {
            return List.of();
        }
        Map<Long, Long> topDish = new LinkedHashMap<>();
        for (HotService.HotDish dish : hotService.thisWeek()) {
            topDish.putIfAbsent(dish.stallId(), dish.menuItemId());
        }
        List<StallWait> waits = new java.util.ArrayList<>();
        for (Stall stall : stallRepository.findAllWithMenuItems()) {
            if (stall.isListingOnly() || stall.isClosedToday() || stall.isOrdersPaused()) continue;
            Long hot = topDish.get(stall.getId());
            stall.getMenuItems().stream()
                    .filter(MenuItem::isAvailable)
                    .filter(item -> hot == null || item.getId().equals(hot))
                    .findFirst()
                    .or(() -> stall.getMenuItems().stream().filter(MenuItem::isAvailable).findFirst())
                    .flatMap(item -> estimate(stall.getId(), List.of(new BasketLine(item.getId(), 1)), null))
                    .ifPresent(p -> waits.add(new StallWait(stall.getId(), p.minutes(), p.simulated())));
        }
        return waits;
    }

    private static EtaModelClient.Line line(MenuItem item, int quantity) {
        return new EtaModelClient.Line(item.getName(), item.getCategory(), Math.min(quantity, MAX_QUANTITY));
    }
}
