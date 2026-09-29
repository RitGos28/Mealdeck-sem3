package com.mealdeck.service;

import com.mealdeck.model.MenuItem;
import com.mealdeck.model.Order;
import com.mealdeck.model.OrderItem;
import com.mealdeck.model.OrderStatus;
import com.mealdeck.model.Stall;
import com.mealdeck.repository.MenuItemRepository;
import com.mealdeck.repository.OrderRepository;
import com.mealdeck.web.OrderRequests.CreateOrderRequest;
import com.mealdeck.web.OrderRequests.OrderItemRequest;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OrderService {

    /** How long a READY order waits to be collected before it's a no-show. */
    public static final Duration NO_SHOW_AFTER = Duration.ofMinutes(15);

    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;
    private final SlotService slotService;
    private final Clock clock;

    public OrderService(
            OrderRepository orderRepository,
            MenuItemRepository menuItemRepository,
            SlotService slotService,
            Clock clock) {
        this.orderRepository = orderRepository;
        this.menuItemRepository = menuItemRepository;
        this.slotService = slotService;
        this.clock = clock;
    }

    /** A cart can hold items from several stalls; each vendor must only ever
     * see their own orders, so checkout splits the cart into one Order per
     * stall here and returns all of them together for one confirmation.
     * Each stall's order gets its own pickup slot, from pickupTimes. */
    @Transactional
    public List<Order> checkout(CreateOrderRequest request) {
        if (request.items() == null || request.items().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart is empty");
        }
        if (isBlank(request.customerName()) || isBlank(request.customerContact())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name and contact are required");
        }
        Map<Long, LocalTime> pickupTimes = request.pickupTimes() != null ? request.pickupTimes() : Map.of();
        LocalDate today = slotService.today();

        Map<Long, Order> ordersByStall = new LinkedHashMap<>();
        for (OrderItemRequest line : request.items()) {
            if (line.quantity() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be positive");
            }
            MenuItem item = menuItemRepository.findById(line.menuItemId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "No menu item " + line.menuItemId()));
            if (!item.isAvailable()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, item.getName() + " is out of stock");
            }

            Order order = ordersByStall.computeIfAbsent(item.getStall().getId(), stallId -> {
                LocalTime pickupTime = pickupTimes.get(stallId);
                slotService.requireBookable(item.getStall(), pickupTime);
                return new Order(item.getStall(), request.customerName().trim(), request.customerContact().trim(), today, pickupTime);
            });
            order.addItem(new OrderItem(order, item, line.quantity(), item.getPrice()));
        }

        List<Order> orders = new ArrayList<>(ordersByStall.values());
        return orderRepository.saveAll(orders);
    }

    /** The vendor's working list: today's orders, in pickup-slot order. */
    public List<Order> todaysOrdersForStall(Long stallId) {
        return orderRepository.findByStallIdAndPickupDateWithItems(stallId, slotService.today());
    }

    public List<Order> allOrders() {
        return orderRepository.findAllWithItems();
    }

    public Order getOrder(Long id) {
        return orderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No order " + id));
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    @Transactional
    public Order advanceStatus(Long stallId, Long orderId, OrderStatus next) {
        Order order = getOrder(orderId);
        if (!order.getStall().getId().equals(stallId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "That order belongs to another stall");
        }
        if (!order.getStatus().canTransitionTo(next)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Can't move an order from " + order.getStatus() + " to " + next);
        }
        order.setStatus(next);
        if (next == OrderStatus.READY) {
            order.setReadyAt(Instant.now(clock));
        }
        return order;
    }

    /** Every READY order older than NO_SHOW_AFTER becomes NO_SHOW. Returns
     * how many were changed. Run by NoShowScheduler. */
    @Transactional
    public int expireUncollected() {
        return orderRepository.markUncollectedAsNoShow(Instant.now(clock).minus(NO_SHOW_AFTER));
    }
}
