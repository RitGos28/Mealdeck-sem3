package com.mealdeck.service;

import com.mealdeck.model.Order;
import com.mealdeck.model.OrderItem;
import com.mealdeck.model.OrderStatus;
import com.mealdeck.model.Stall;
import com.mealdeck.model.Student;
import com.mealdeck.repository.OrderRepository;
import com.mealdeck.repository.StallRepository;
import com.mealdeck.repository.StudentRepository;
import com.mealdeck.web.PitchDto;
import com.mealdeck.web.PitchDto.Day;
import com.mealdeck.web.PitchDto.Dish;
import com.mealdeck.web.PitchDto.StallLine;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Predicate;
import java.util.stream.Stream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Pitch numbers for the admin Overview, worked out from orders already on
 * record: nothing extra is tracked. Test accounts are left out so the
 * numbers are only real students. */
@Service
public class PitchService {

    private static final ZoneId CAMPUS = ZoneId.of("Asia/Kolkata");
    private static final int TOP_DISHES = 5;

    private final OrderRepository orderRepository;
    private final StallRepository stallRepository;
    private final StudentRepository studentRepository;
    private final Clock clock;
    private final List<String> testAccounts;

    public PitchService(OrderRepository orderRepository, StallRepository stallRepository, StudentRepository studentRepository, Clock clock,
            @Value("${mealdeck.account.deletion-protected:}") List<String> protectedAccounts,
            @Value("${mealdeck.pitch.test-accounts:}") List<String> extraTestAccounts) {
        this.orderRepository = orderRepository;
        this.stallRepository = stallRepository;
        this.studentRepository = studentRepository;
        this.clock = clock;
        // Protected accounts (the demo student, Play reviewers) are test
        // accounts by definition; PITCH_TEST_ACCOUNTS adds your own.
        this.testAccounts = Stream.concat(Stream.of("student@bennett.edu.in"), Stream.concat(protectedAccounts.stream(), extraTestAccounts.stream()))
                .map(e -> e.trim().toLowerCase()).filter(e -> !e.isEmpty()).distinct().toList();
    }

    @Transactional(readOnly = true)
    public PitchDto summarize() {
        LocalDate today = LocalDate.now(clock.withZone(CAMPUS));
        LocalDate weekStart = today.minusDays(6);
        Instant weekStartInstant = weekStart.atStartOfDay(CAMPUS).toInstant();

        List<Student> students = studentRepository.findAll().stream().filter(s -> !isTest(s)).toList();
        int joinedThisWeek = (int) students.stream()
                .filter(s -> s.getCreatedAt() != null && !s.getCreatedAt().isBefore(weekStartInstant)).count();

        List<Order> orders = orderRepository.findAllWithItems().stream()
                .filter(o -> o.getStudent() == null || !isTest(o.getStudent()))
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .toList();

        // Days each customer ordered on; a repeat customer came back another day.
        Map<String, Set<LocalDate>> daysByCustomer = new HashMap<>();
        for (Order order : orders) {
            String who = customer(order);
            if (who != null) daysByCustomer.computeIfAbsent(who, k -> new HashSet<>()).add(order.getPickupDate());
        }
        int customers = daysByCustomer.size();
        int repeat = (int) daysByCustomer.values().stream().filter(days -> days.size() > 1).count();

        Map<LocalDate, Integer> perDay = new LinkedHashMap<>();
        for (int i = 13; i >= 0; i--) perDay.put(today.minusDays(i), 0);
        for (Order order : orders) perDay.computeIfPresent(order.getPickupDate(), (d, n) -> n + 1);
        List<Day> lastTwoWeeks = perDay.entrySet().stream().map(e -> new Day(e.getKey(), e.getValue())).toList();

        List<Stall> stalls = stallRepository.findAllWithMenuItems();
        List<StallLine> stallLines = stalls.stream().map(stall -> {
            List<Order> mine = orders.stream().filter(o -> o.getStall().getId().equals(stall.getId())).toList();
            int stallCustomers = (int) mine.stream().map(this::customer).filter(Objects::nonNull).distinct().count();
            return new StallLine(stall.getName(), !stall.isListingOnly(), mine.size(), stallCustomers, value(mine), onTimeRate(mine));
        }).sorted(Comparator.comparing(StallLine::takingOrders).reversed().thenComparing(Comparator.comparingInt(StallLine::orders).reversed())).toList();

        Map<String, int[]> qty = new HashMap<>();
        Map<String, String[]> names = new HashMap<>();
        for (Order order : orders) {
            for (OrderItem line : order.getItems()) {
                String key = line.getMenuItem().getId().toString();
                qty.computeIfAbsent(key, k -> new int[1])[0] += line.getQuantity();
                names.putIfAbsent(key, new String[] {line.getMenuItem().getName(), order.getStall().getName()});
            }
        }
        List<Dish> topDishes = qty.entrySet().stream()
                .sorted((a, b) -> Integer.compare(b.getValue()[0], a.getValue()[0]))
                .limit(TOP_DISHES)
                .map(e -> new Dish(names.get(e.getKey())[0], names.get(e.getKey())[1], e.getValue()[0]))
                .toList();

        long collected = orders.stream().filter(o -> o.getStatus() == OrderStatus.COMPLETED).count();
        long noShows = orders.stream().filter(o -> o.getStatus() == OrderStatus.NO_SHOW).count();

        return new PitchDto(
                orders.stream().map(Order::getPickupDate).min(Comparator.naturalOrder()).orElse(null),
                students.size(),
                joinedThisWeek,
                customers,
                repeat,
                percent(repeat, customers),
                orders.size(),
                count(orders, o -> !o.getPickupDate().isBefore(weekStart)),
                value(orders),
                percent(collected, collected + noShows),
                onTimeRate(orders),
                (int) stalls.stream().filter(s -> !s.isListingOnly()).count(),
                stalls.size(),
                stalls.stream().mapToInt(s -> s.getMenuItems().size()).sum(),
                testAccounts,
                lastTwoWeeks,
                stallLines,
                topDishes);
    }

    private boolean isTest(Student student) {
        return testAccounts.contains(student.getEmail().toLowerCase());
    }

    /** The student, or for a deleted account the order's one-way email code
     * (kept 30 days); null if neither is known any more. */
    private String customer(Order order) {
        if (order.getStudent() != null) return "s" + order.getStudent().getId();
        return order.getCustomerEmailKey() == null ? null : "k" + order.getCustomerEmailKey();
    }

    private static BigDecimal value(List<Order> orders) {
        return orders.stream()
                .filter(o -> o.getStatus() != OrderStatus.NO_SHOW)
                .flatMap(o -> o.getItems().stream())
                .map(i -> i.getPriceAtOrder().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** Share of orders marked ready by their pickup time. */
    private static Integer onTimeRate(List<Order> orders) {
        List<Order> readied = orders.stream().filter(o -> o.getReadyAt() != null).toList();
        long onTime = readied.stream()
                .filter(o -> !o.getReadyAt().isAfter(o.getPickupDate().atTime(o.getPickupTime()).atZone(CAMPUS).toInstant()))
                .count();
        return percent(onTime, readied.size());
    }

    private static int count(List<Order> orders, Predicate<Order> test) {
        return (int) orders.stream().filter(test).count();
    }

    private static Integer percent(long part, long whole) {
        return whole == 0 ? null : (int) Math.round(100.0 * part / whole);
    }
}
