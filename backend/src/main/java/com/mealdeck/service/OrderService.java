package com.mealdeck.service;

import com.mealdeck.model.MenuItem;
import com.mealdeck.model.Order;
import com.mealdeck.model.OrderCode;
import com.mealdeck.model.OrderItem;
import com.mealdeck.model.OrderStatus;
import com.mealdeck.model.Stall;
import com.mealdeck.model.Student;
import com.mealdeck.repository.MenuItemRepository;
import com.mealdeck.repository.OrderRepository;
import com.mealdeck.repository.StallRepository;
import com.mealdeck.repository.StudentRepository;
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
import java.util.Optional;
import java.util.TreeSet;
import org.springframework.context.ApplicationEventPublisher;
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
    private final StallRepository stallRepository;
    private final StudentRepository studentRepository;
    private final SlotService slotService;
    private final ApplicationEventPublisher events;
    private final Clock clock;
    private final AccountDeletionService accountDeletion;
    private final EmailStandingService emailStanding;
    private final ActivityLogService activityLog;
    private final int maxOpenPerStall;

    public OrderService(
            OrderRepository orderRepository,
            MenuItemRepository menuItemRepository,
            StallRepository stallRepository,
            StudentRepository studentRepository,
            SlotService slotService,
            ApplicationEventPublisher events,
            Clock clock,
            AccountDeletionService accountDeletion,
            EmailStandingService emailStanding,
            ActivityLogService activityLog,
            @org.springframework.beans.factory.annotation.Value("${mealdeck.orders.max-open-per-stall:2}") int maxOpenPerStall) {
        this.maxOpenPerStall = maxOpenPerStall;
        this.activityLog = activityLog;
        this.emailStanding = emailStanding;
        this.orderRepository = orderRepository;
        this.stallRepository = stallRepository;
        this.studentRepository = studentRepository;
        this.events = events;
        this.menuItemRepository = menuItemRepository;
        this.slotService = slotService;
        this.clock = clock;
        this.accountDeletion = accountDeletion;
    }

    /** A cart can hold items from several stalls; each vendor must only ever
     * see their own orders, so checkout splits the cart into one Order per
     * stall here and returns all of them together for one confirmation.
     * Each stall's order gets its own pickup slot, from pickupTimes. */
    @Transactional
    public List<Order> checkout(Long studentId, CreateOrderRequest request) {
        if (request.items() == null || request.items().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart is empty");
        }
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Log in as a student to order"));
        Map<Long, LocalTime> pickupTimes = request.pickupTimes() != null ? request.pickupTimes() : Map.of();
        LocalDate today = slotService.today();
        accountDeletion.requireCanOrder(student, pickupTimes.values(), today);
        emailStanding.requireCanOrder(student);
        String emailKey = emailStanding.keyFor(student.getEmail());

        String hostelRoom = cleanRoom(request.hostelRoom());
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
            if (item.getStall().isListingOnly()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        item.getStall().getName() + " isn't taking pre-orders yet. Order at the counter for now");
            }

            Order order = ordersByStall.computeIfAbsent(item.getStall().getId(), stallId -> {
                LocalTime pickupTime = pickupTimes.get(stallId);
                slotService.requireBookable(item.getStall(), pickupTime);
                Order created = new Order(item.getStall(), student, today, pickupTime);
                created.setCustomerEmailKey(emailKey);
                created.setHostelRoom(hostelRoom);
                return created;
            });
            // Free choices are checked against the dish's own options, so an
            // order only ever carries picks the stall actually offers.
            String choices = MenuChoices.describe(item.getChoices(), line.choices(), item.getName());
            order.addItem(new OrderItem(order, item, line.quantity(), item.getPrice(), choices));
        }

        // Lock in ascending stall id, so two carts spanning the same stalls
        // can't each hold one lock while waiting on the other's.
        for (Long stallId : new TreeSet<>(ordersByStall.keySet())) {
            requireRoomInSlot(stallId, ordersByStall.get(stallId).getPickupTime(), today, studentId);
        }

        List<Order> orders = orderRepository.saveAll(new ArrayList<>(ordersByStall.values()));
        orders.forEach(order -> activityLog.preordered(studentId, order));
        ordersByStall.keySet().forEach(stallId -> events.publishEvent(new QueueChangedEvent(stallId)));
        return orders;
    }

    static final int MAX_ROOM_LENGTH = 80;

    /** The optional "Hostel + room": trimmed, blank means none, and too long is refused. */
    private static String cleanRoom(String room) {
        if (room == null || room.isBlank()) return null;
        String trimmed = room.trim();
        if (trimmed.length() > MAX_ROOM_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hostel and room can be at most " + MAX_ROOM_LENGTH + " characters");
        }
        return trimmed;
    }

    /** The stall row stays locked until checkout commits, so the count and
     * the insert can't interleave with another checkout for the same stall:
     * of two students racing for the last spot, the second one sees it
     * taken. */
    private void requireRoomInSlot(Long stallId, LocalTime pickupTime, LocalDate date, Long studentId) {
        Stall stall = stallRepository.findByIdForUpdate(stallId).orElseThrow();
        if (stall.isOrdersPaused()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    stall.getName() + " has paused pre-orders. Try again in a bit");
        }
        // Under the same stall lock, so two checkouts can't both slip past the cap.
        if (orderRepository.countOpenForStudentAtStall(studentId, stallId) >= maxOpenPerStall) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "You already have " + maxOpenPerStall + " orders waiting at " + stall.getName()
                            + ". Pick one up (or have the stall cancel it) before ordering again.");
        }
        long booked = orderRepository.countActiveInSlot(stallId, date, pickupTime);
        if (booked >= stall.getSlotCapacity()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "The " + pickupTime + " slot at " + stall.getName() + " just filled up, pick another time");
        }
    }

    /** The vendor's working list: today's orders, in pickup-slot order. */
    public List<Order> todaysOrdersForStall(Long stallId) {
        return ordersForStallOn(stallId, slotService.today());
    }

    /** Order history: one day's orders for a stall. Future dates have none
     * (orders are only ever for today), so they're refused rather than
     * quietly returning an empty list. */
    public List<Order> ordersForStallOn(Long stallId, LocalDate date) {
        if (date.isAfter(slotService.today())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No orders exist for future dates");
        }
        return orderRepository.findByStallIdAndPickupDateWithItems(stallId, date);
    }

    public List<Order> allOrders() {
        return orderRepository.findAllWithItems();
    }

    public Order getOrder(Long id) {
        return orderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No order " + id));
    }

    public List<Order> ordersForStudent(Long studentId) {
        return orderRepository.findByStudentIdWithItems(studentId);
    }

    @Transactional
    public int fillMissingCodes() {
        List<Order> missing = orderRepository.findByPublicCodeIsNull();
        missing.forEach(order -> order.setPublicCode(OrderCode.next()));
        return missing.size();
    }

    /** Links and API calls name an order by its public code, not its id. */
    public Order getOrderByCode(String code) {
        return (OrderCode.looksValid(code) ? orderRepository.findByPublicCodeWithItems(code) : Optional.<Order>empty())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No such order"));
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
        events.publishEvent(new QueueChangedEvent(stallId));
        return order;
    }

    /** Every READY order older than NO_SHOW_AFTER becomes NO_SHOW. Returns
     * how many were changed. Run by NoShowScheduler. */
    @Transactional
    public int expireUncollected() {
        int expired = orderRepository.markUncollectedAsNoShow(Instant.now(clock).minus(NO_SHOW_AFTER));
        if (expired > 0) {
            // The bulk UPDATE doesn't say which stalls it touched; there are
            // only a handful, so refresh every stall with orders today.
            orderRepository.findStallIdsWithOrdersOn(slotService.today())
                    .forEach(stallId -> events.publishEvent(new QueueChangedEvent(stallId)));
        }
        return expired;
    }
}
