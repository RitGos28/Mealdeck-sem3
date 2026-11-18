package com.mealdeck.service;

import com.mealdeck.model.DealSwipe;
import com.mealdeck.model.DishVote;
import com.mealdeck.model.MenuItem;
import com.mealdeck.model.Order;
import com.mealdeck.model.OrderItem;
import com.mealdeck.model.OrderStatus;
import com.mealdeck.model.Stall;
import com.mealdeck.model.Student;
import com.mealdeck.repository.DealSwipeRepository;
import com.mealdeck.repository.DishVoteRepository;
import com.mealdeck.repository.MenuItemRepository;
import com.mealdeck.repository.OrderRepository;
import com.mealdeck.repository.StallRepository;
import com.mealdeck.repository.StudentRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.stream.Stream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Local demos only: fills the in-memory demo database with SIMULATED
 * history, so Hot this week, the votes, the Deal model and the wait
 * estimates have something to show. Off unless DEMO_HISTORY=true, and only
 * in the demo profile, so it never touches tests or production. The app
 * shows a "simulated data" banner while it's on (see /api/demo-info).
 *
 * With DEMO_MENU_DIR pointing at the menu CSVs it loads every stall's real
 * menu first, and then every stall is menu only, as on mealdeck.in, except
 * the fictional sample stall "Bistro / Kathi", which shows what pre-ordering
 * (and its wait estimate) will look like once stalls opt in. */
@Component
@Profile("demo")
public class DemoHistorySeeder {

    private static final Logger log = LoggerFactory.getLogger(DemoHistorySeeder.class);
    private static Map<com.mealdeck.model.MessMeal.Meal, List<String>> mess(List<String> breakfast, List<String> lunch, List<String> snacks, List<String> dinner) {
        Map<com.mealdeck.model.MessMeal.Meal, List<String>> m = new java.util.EnumMap<>(com.mealdeck.model.MessMeal.Meal.class);
        m.put(com.mealdeck.model.MessMeal.Meal.BREAKFAST, breakfast);
        m.put(com.mealdeck.model.MessMeal.Meal.LUNCH, lunch);
        m.put(com.mealdeck.model.MessMeal.Meal.SNACKS, snacks);
        m.put(com.mealdeck.model.MessMeal.Meal.DINNER, dinner);
        return m;
    }

    private static final List<String> MESS_SWAPS = List.of("Mix Veg", "Aloo Gobi", "Boondi Raita", "Kheer", "Papad", "Salad");

    /** The weekly mess rotation for demo history. Wednesday is real (MyCamu, 2026-11-18). */
    private static final Map<java.time.DayOfWeek, Map<com.mealdeck.model.MessMeal.Meal, List<String>>> MESS_ROTATION = Map.of(
            java.time.DayOfWeek.MONDAY, mess(List.of("Aloo Paratha", "Curd", "Pickle", "Tea"), List.of("Chole", "Rice", "Roti", "Salad"), List.of("Samosa", "Tea"), List.of("Dal Tadka", "Paneer Butter Masala", "Rice", "Roti")),
            java.time.DayOfWeek.TUESDAY, mess(List.of("Poha", "Jalebi", "Tea"), List.of("Rajma", "Jeera Rice", "Roti", "Raita"), List.of("Bread Pakora", "Tea"), List.of("Kadhi", "Aloo Jeera", "Rice", "Roti")),
            java.time.DayOfWeek.WEDNESDAY, mess(List.of("Indoori Poha", "Green Chutney", "Egg Bhurji", "Veg Daliya", "Brown & White Bread", "Milk / Tea / Coffee"),
                    List.of("Aloo Jeera", "Kadhi Pakora", "Moong Dal", "Jeera Rice", "Roti", "Carrot Cucumber", "Sambar"),
                    List.of("Aloo Papdi Chaat", "Sweet & Green Chutney", "Tea", "Lemon Water"),
                    List.of("Keema Matar", "Petha Masala", "Dal Makhani", "Jeera Rice", "Roti", "Fruit Custard", "Dal Shorba")),
            java.time.DayOfWeek.THURSDAY, mess(List.of("Idli", "Sambar", "Coconut Chutney", "Tea"), List.of("Dal Fry", "Mix Veg", "Rice", "Roti"), List.of("Pav Bhaji", "Tea"), List.of("Chicken Curry", "Matar Paneer", "Rice", "Roti")),
            java.time.DayOfWeek.FRIDAY, mess(List.of("Chole Bhature", "Tea"), List.of("Dal Makhani", "Aloo Gobi", "Rice", "Roti"), List.of("Veg Cutlet", "Tea"), List.of("Veg Biryani", "Raita", "Gulab Jamun")),
            java.time.DayOfWeek.SATURDAY, mess(List.of("Upma", "Banana", "Tea"), List.of("Sambar", "Rice", "Cabbage Poriyal", "Curd"), List.of("Maggi", "Tea"), List.of("Egg Curry", "Dal", "Rice", "Roti")),
            java.time.DayOfWeek.SUNDAY, mess(List.of("Puri Bhaji", "Tea"), List.of("Paneer Pulao", "Raita", "Papad"), List.of("Pakora", "Tea"), List.of("Chicken Biryani", "Veg Biryani", "Raita", "Ice Cream")));

    /** The one stall that takes pre-orders in a demo with real menus loaded. */
    private static final String PREVIEW_STALL = "Bistro / Kathi";
    private static final int STUDENTS = 40;
    private static final int PAST_DAYS = 13;

    private final boolean enabled;
    private final String menuDir;
    private final StallRepository stallRepository;
    private final MenuItemRepository menuItemRepository;
    private final StudentRepository studentRepository;
    private final OrderRepository orderRepository;
    private final DishVoteRepository voteRepository;
    private final DealSwipeRepository swipeRepository;
    private final SlotService slotService;
    private final DealLearningService dealLearning;
    private final Clock clock;
    private final com.mealdeck.repository.SoldOutEventRepository soldOutRepository;
    private final com.mealdeck.repository.MessMealRepository messMealRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public DemoHistorySeeder(
            @Value("${mealdeck.demo.history:false}") boolean enabled,
            @Value("${mealdeck.demo.menu-dir:}") String menuDir,
            StallRepository stallRepository, MenuItemRepository menuItemRepository, StudentRepository studentRepository,
            OrderRepository orderRepository, DishVoteRepository voteRepository, DealSwipeRepository swipeRepository,
            SlotService slotService, DealLearningService dealLearning, Clock clock,
            com.mealdeck.repository.SoldOutEventRepository soldOutRepository,
            com.mealdeck.repository.MessMealRepository messMealRepository) {
        this.soldOutRepository = soldOutRepository;
        this.messMealRepository = messMealRepository;
        this.enabled = enabled;
        this.menuDir = menuDir;
        this.stallRepository = stallRepository;
        this.menuItemRepository = menuItemRepository;
        this.studentRepository = studentRepository;
        this.orderRepository = orderRepository;
        this.voteRepository = voteRepository;
        this.swipeRepository = swipeRepository;
        this.slotService = slotService;
        this.dealLearning = dealLearning;
        this.clock = clock;
    }

    public boolean isEnabled() {
        return enabled;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seed() {
        if (!enabled || studentRepository.findByEmail(simEmail(1)).isPresent()) return;
        if (!menuDir.isBlank()) {
            loadMenus(Path.of(menuDir));
            // Stalls already loaded in this transaction keep their old
            // (empty or partial) menu lists; start fresh so the reload sees
            // every dish just added.
            entityManager.flush();
            entityManager.clear();
        }

        Random rng = new Random(7);
        List<Stall> stalls = stallRepository.findAllWithMenuItems();
        List<MenuItem> dishes = stalls.stream().flatMap(s -> s.getMenuItems().stream()).filter(MenuItem::isAvailable).toList();
        Map<Long, Double> popularity = new HashMap<>();
        dishes.forEach(d -> popularity.put(d.getId(), rng.nextGaussian()));

        List<Student> students = new ArrayList<>();
        Set<Long> vegStudents = new HashSet<>();
        for (int i = 1; i <= STUDENTS; i++) {
            Student s = studentRepository.save(new Student(simEmail(i), "!simulated", "Simulated student " + i, null));
            students.add(s);
            if (rng.nextDouble() < 0.35) vegStudents.add(s.getId());
        }

        List<Stall> ordering = stalls.stream().filter(s -> !s.isListingOnly() && !s.getMenuItems().isEmpty()).toList();
        LocalDate today = slotService.today();
        int orders = 0;
        Map<Long, Set<Long>> collected = new HashMap<>();
        for (int day = PAST_DAYS; day >= 1; day--) {
            LocalDate date = today.minusDays(day);
            int count = 20 + rng.nextInt(21);
            for (int n = 0; n < count; n++) {
                Student student = students.get(rng.nextInt(students.size()));
                Stall stall = ordering.get(rng.nextInt(ordering.size()));
                LocalTime time = LocalTime.of(9 + rng.nextInt(12), 15 * rng.nextInt(4));
                double roll = rng.nextDouble();
                OrderStatus status = roll < 0.80 ? OrderStatus.COMPLETED : roll < 0.88 ? OrderStatus.NO_SHOW : OrderStatus.CANCELLED;
                Order order = order(stall, student, date, time, status, vegStudents.contains(student.getId()), popularity, rng);
                if (order == null) continue;
                orders++;
                if (status == OrderStatus.COMPLETED) {
                    order.getItems().forEach(i -> collected.computeIfAbsent(student.getId(), k -> new HashSet<>()).add(i.getMenuItem().getId()));
                }
            }
        }
        // Today: a few orders still waiting at each stall, so queues differ.
        int today_ = 0;
        for (Stall stall : ordering) {
            List<LocalTime> slots = slotService.upcomingSlots(stall);
            int waiting = slots.isEmpty() ? 0 : rng.nextInt(7);
            for (int n = 0; n < waiting; n++) {
                Student student = students.get(rng.nextInt(students.size()));
                LocalTime time = slots.get(Math.min(rng.nextInt(3), slots.size() - 1));
                OrderStatus status = rng.nextBoolean() ? OrderStatus.PLACED : OrderStatus.ACCEPTED;
                if (order(stall, student, today, time, status, vegStudents.contains(student.getId()), popularity, rng) != null) today_++;
            }
        }

        // Votes on dishes students have "had" (any stall, since most are menu
        // only): popular dishes get more votes and more of them "Amazing".
        int votes = 0;
        Map<Long, MenuItem> byId = new HashMap<>();
        dishes.forEach(d -> byId.put(d.getId(), d));
        for (Student student : students) {
            Set<Long> had = new HashSet<>(collected.getOrDefault(student.getId(), Set.of()));
            for (int n = 0; n < 12; n++) had.add(pickPopular(dishes, popularity, rng).getId());
            for (Long dishId : had) {
                if (rng.nextDouble() > 0.5) continue;
                boolean amazing = rng.nextDouble() < DealModel.sigmoid(0.6 + 1.5 * popularity.get(dishId));
                voteRepository.save(new DishVote(student, byId.get(dishId), amazing, clock.instant()));
                votes++;
            }
        }

        // Deal swipes: veg students skip non-veg; everyone leans to popular dishes.
        int swipes = 0;
        for (Student student : students) {
            boolean veg = vegStudents.contains(student.getId());
            for (int n = 0; n < 20; n++) {
                MenuItem dish = dishes.get(rng.nextInt(dishes.size()));
                double logit = 1.3 * popularity.get(dish.getId()) - 0.3 + (veg && !dish.isVeg() ? -4 : 0);
                swipeRepository.save(new DealSwipe(student, dish, rng.nextDouble() < DealModel.sigmoid(logit), clock.instant()));
                swipes++;
            }
        }
        // Sold-out history: popular dishes run out on some days, each around
        // its own usual time (lunch-rush dishes early, snacks late).
        int soldOut = 0;
        List<MenuItem> popular = dishes.stream()
                .sorted((a, b) -> Double.compare(popularity.get(b.getId()), popularity.get(a.getId())))
                .limit(40).toList();
        for (MenuItem dish : popular) {
            double chance = 0.15 + 0.5 * rng.nextDouble();
            int usualMinute = 12 * 60 + rng.nextInt(9 * 60); // 12:00-21:00
            for (int day = 1; day <= 27; day++) {
                if (rng.nextDouble() > chance) continue;
                int minute = Math.max(9 * 60, Math.min(22 * 60, usualMinute + (int) (rng.nextGaussian() * 35)));
                java.time.Instant at = today.minusDays(day).atTime(minute / 60, minute % 60)
                        .atZone(ZoneId.of("Asia/Kolkata")).toInstant();
                soldOutRepository.save(new com.mealdeck.model.SoldOutEvent(dish, at, rng.nextDouble() < 0.3));
                soldOut++;
            }
        }

        // Mess history: six weeks of a weekly rotation, with the odd swap, so
        // "Probably: ..." has something to learn. Wednesday is the real menu
        // from MyCamu screenshots of 2026-11-18; the rest are typical.
        int messMeals = 0;
        for (int day = 1; day <= 42; day++) {
            LocalDate date = today.minusDays(day);
            Map<com.mealdeck.model.MessMeal.Meal, List<String>> menu = MESS_ROTATION.get(date.getDayOfWeek());
            for (var meal : menu.entrySet()) {
                List<String> served = new ArrayList<>(meal.getValue());
                if (rng.nextDouble() < 0.25 && served.size() > 2) served.set(rng.nextInt(served.size()), MESS_SWAPS.get(rng.nextInt(MESS_SWAPS.size())));
                messMealRepository.save(new com.mealdeck.model.MessMeal(date, meal.getKey(), served, null,
                        date.atTime(9, 0).atZone(ZoneId.of("Asia/Kolkata")).toInstant()));
                messMeals++;
            }
        }

        swipeRepository.flush();
        dealLearning.rebuild();
        log.info("SIMULATED demo history: {} students, {} past orders, {} waiting today, {} votes, {} deal swipes, {} sold-out events, {} past mess meals",
                STUDENTS, orders, today_, votes, swipes, soldOut, messMeals);
    }

    private Order order(Stall stall, Student student, LocalDate date, LocalTime time, OrderStatus status,
            boolean veg, Map<Long, Double> popularity, Random rng) {
        List<MenuItem> menu = stall.getMenuItems().stream().filter(MenuItem::isAvailable).filter(d -> !veg || d.isVeg()).toList();
        if (menu.isEmpty()) return null;
        Order order = new Order(stall, student, date, time);
        order.setStatus(status);
        int lines = 1 + (rng.nextDouble() < 0.35 ? 1 : 0) + (rng.nextDouble() < 0.1 ? 1 : 0);
        Set<Long> used = new HashSet<>();
        for (int l = 0; l < lines; l++) {
            MenuItem dish = pickPopular(menu, popularity, rng);
            if (!used.add(dish.getId())) continue;
            order.addItem(new OrderItem(order, dish, rng.nextDouble() < 0.8 ? 1 : 2, dish.getPrice()));
        }
        if (status == OrderStatus.COMPLETED || status == OrderStatus.NO_SHOW) {
            order.setReadyAt(date.atTime(time).minusMinutes(rng.nextInt(5)).atZone(ZoneId.of("Asia/Kolkata")).toInstant());
        }
        return orderRepository.save(order);
    }

    /** A dish drawn with weight e^popularity, so a few dishes are clear favourites. */
    private static MenuItem pickPopular(List<MenuItem> menu, Map<Long, Double> popularity, Random rng) {
        double total = 0;
        for (MenuItem d : menu) total += Math.exp(1.5 * popularity.getOrDefault(d.getId(), 0.0));
        double r = rng.nextDouble() * total;
        for (MenuItem d : menu) {
            r -= Math.exp(1.5 * popularity.getOrDefault(d.getId(), 0.0));
            if (r <= 0) return d;
        }
        return menu.getLast();
    }

    private static String simEmail(int n) {
        return "simulated" + n + "@bennett.edu.in";
    }

    /** Adds every CSV's dishes, creating stalls that don't exist yet. */
    private void loadMenus(Path dir) {
        Map<String, Stall> stalls = new HashMap<>();
        stallRepository.findAll().forEach(s -> stalls.put(s.getName().toLowerCase(), s));
        Set<String> existing = new HashSet<>();
        menuItemRepository.findAll().forEach(i -> existing.add(i.getStall().getId() + "/" + i.getName().toLowerCase()));
        int added = 0;
        try (Stream<Path> files = Files.list(dir)) {
            for (Path file : files.filter(f -> f.toString().endsWith(".csv")).sorted().toList()) {
                List<String> lines = Files.readAllLines(file, StandardCharsets.UTF_8);
                for (String line : lines.subList(1, lines.size())) {
                    List<String> cols = parseCsvLine(line);
                    if (cols.size() < 5 || cols.get(2).isBlank()) continue;
                    String stallName = cols.get(0).trim();
                    Stall stall = stalls.computeIfAbsent(stallName.toLowerCase(), key -> {
                        Stall created = new Stall(stallName);
                        created.setOpenTime(LocalTime.of(8, 0));
                        created.setCloseTime(LocalTime.of(22, 0));
                        return stallRepository.save(created);
                    });
                    if (!existing.add(stall.getId() + "/" + cols.get(2).trim().toLowerCase())) continue;
                    MenuItem item = new MenuItem(stall, cols.get(2).trim(), new BigDecimal(cols.get(3).trim()),
                            !cols.get(4).trim().toLowerCase().startsWith("non"));
                    item.setCategory(cols.get(1).trim());
                    menuItemRepository.save(item);
                    added++;
                }
            }
        } catch (IOException | RuntimeException e) {
            log.warn("Couldn't load demo menus from {}: {}", dir, e.toString());
        }
        // Real stalls are menu only, as on the live site; only the sample
        // stall previews pre-ordering.
        for (Stall stall : stallRepository.findAll()) {
            stall.setListingOnly(!stall.getName().equals(PREVIEW_STALL));
        }
        menuItemRepository.flush();
        log.info("Demo menus: added {} dishes from {}", added, dir);
    }

    /** One CSV line, honouring double-quoted fields with commas in them. */
    static List<String> parseCsvLine(String line) {
        List<String> out = new ArrayList<>();
        StringBuilder cell = new StringBuilder();
        boolean quoted = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (quoted) {
                if (c == '"' && i + 1 < line.length() && line.charAt(i + 1) == '"') { cell.append('"'); i++; }
                else if (c == '"') quoted = false;
                else cell.append(c);
            } else if (c == '"') {
                quoted = true;
            } else if (c == ',') {
                out.add(cell.toString());
                cell.setLength(0);
            } else {
                cell.append(c);
            }
        }
        out.add(cell.toString());
        return out;
    }
}
