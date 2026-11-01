package com.mealdeck.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.mealdeck.FixedClockConfig;
import com.mealdeck.model.MenuItem;
import com.mealdeck.model.Order;
import com.mealdeck.model.Stall;
import com.mealdeck.repository.StallRepository;
import com.mealdeck.repository.StudentRepository;
import com.mealdeck.web.ChoiceGroup;
import com.mealdeck.web.MenuItemDto;
import com.mealdeck.web.MenuItemRequests.CreateMenuItemRequest;
import com.mealdeck.web.MenuItemRequests.UpdateMenuItemRequest;
import com.mealdeck.web.OrderDto;
import com.mealdeck.web.OrderRequests.CreateOrderRequest;
import com.mealdeck.web.OrderRequests.OrderItemRequest;
import java.math.BigDecimal;
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

/** Free choices on dishes (Bread, Dry/Gravy...): storing them, and checking
 * a student's picks at checkout. */
@SpringBootTest
@ActiveProfiles("demo")
@Import(FixedClockConfig.class)
@Transactional
class MenuChoicesTests {

    @Autowired MenuService menuService;
    @Autowired OrderService orderService;
    @Autowired StallRepository stallRepository;
    @Autowired StudentRepository studentRepository;

    private static final List<ChoiceGroup> MEAL = List.of(
            new ChoiceGroup("Bread", List.of("Butter Naan ×1", "Butter Roti ×2")),
            new ChoiceGroup("Style", List.of("Dry", "Gravy")));

    private Stall bistro() {
        return stallRepository.findAllWithMenuItems().stream().filter(s -> s.getName().equals("Bistro / Kathi")).findFirst().orElseThrow();
    }

    private MenuItem dish(List<ChoiceGroup> choices) {
        return menuService.addItem(bistro().getId(), new CreateMenuItemRequest("Butter Chicken (Mini Meal)", new BigDecimal("230"), false, "Mini Meal", choices));
    }

    private Order order(MenuItem item, Map<String, String> picks) {
        Long student = studentRepository.findByEmail("student@bennett.edu.in").orElseThrow().getId();
        return orderService.checkout(student, new CreateOrderRequest(List.of(new OrderItemRequest(item.getId(), 1, picks)), Map.of(bistro().getId(), LocalTime.NOON))).getFirst();
    }

    private static void assertRejected(ThrowingCallable call, String messagePart) {
        assertThatThrownBy(call).isInstanceOfSatisfying(ResponseStatusException.class, e -> {
            assertThat(e.getStatusCode().value()).isEqualTo(HttpStatus.BAD_REQUEST.value());
            assertThat(e.getReason()).contains(messagePart);
        });
    }

    @Test
    void choicesAreStoredTidiedAndShownOnTheMenu() {
        MenuItem item = dish(List.of(new ChoiceGroup("  Bread ", List.of(" Butter Naan ×1 ", "Butter   Roti ×2"))));
        assertThat(MenuItemDto.from(item).choices()).containsExactly(new ChoiceGroup("Bread", List.of("Butter Naan ×1", "Butter Roti ×2")));
    }

    @Test
    void badChoiceSetupsAreRefused() {
        assertRejected(() -> dish(List.of(new ChoiceGroup("Bread", List.of("Naan")))), "needs 2 to");
        assertRejected(() -> dish(List.of(new ChoiceGroup("Bread", List.of("Naan", "Naan")))), "twice");
        assertRejected(() -> dish(List.of(new ChoiceGroup("Bread", List.of("Naan", "Roti")), new ChoiceGroup("bread", List.of("A", "B")))), "both called");
        assertRejected(() -> dish(List.of(new ChoiceGroup(" ", List.of("A", "B")))), "can't be empty");
        assertRejected(() -> dish(List.of(new ChoiceGroup("Bread", List.of("Naan|Roti", "Puri")))), "can't contain");
        assertRejected(() -> dish(List.of(new ChoiceGroup("A", List.of("1", "2")), new ChoiceGroup("B", List.of("1", "2")), new ChoiceGroup("C", List.of("1", "2")), new ChoiceGroup("D", List.of("1", "2")), new ChoiceGroup("E", List.of("1", "2")))), "at most");
    }

    @Test
    void anEmptyListRemovesChoicesAndNullLeavesThem() {
        MenuItem item = dish(MEAL);
        menuService.updateItem(bistro().getId(), item.getId(), new UpdateMenuItemRequest(null, null, null, null, null, null));
        assertThat(MenuItemDto.from(item).choices()).hasSize(2);
        menuService.updateItem(bistro().getId(), item.getId(), new UpdateMenuItemRequest(null, null, null, null, null, List.of()));
        assertThat(MenuItemDto.from(item).choices()).isEmpty();
    }

    @Test
    void checkoutStoresThePicksForTheStall() {
        MenuItem item = dish(MEAL);
        Order order = order(item, Map.of("Style", "Gravy", "Bread", "Butter Roti ×2"));
        // In the dish's group order, as the stall reads it.
        assertThat(OrderDto.from(order).items().getFirst().choices()).isEqualTo("Bread: Butter Roti ×2 · Style: Gravy");
    }

    @Test
    void checkoutRefusesMissingWrongOrUnknownPicks() {
        MenuItem item = dish(MEAL);
        assertRejected(() -> order(item, Map.of("Bread", "Butter Roti ×2")), "Pick a style");
        assertRejected(() -> order(item, Map.of("Bread", "Garlic Naan", "Style", "Dry")), "isn't a bread option");
        assertRejected(() -> order(item, Map.of("Bread", "Butter Naan ×1", "Style", "Dry", "Extra", "Cheese")), "no \"Extra\" choice");
    }

    @Test
    void plainDishesTakeNoPicks() {
        MenuItem plain = bistro().getMenuItems().getFirst();
        assertThat(OrderDto.from(order(plain, null)).items().getFirst().choices()).isNull();
        assertRejected(() -> order(plain, Map.of("Bread", "Naan")), "has no choices");
    }
}
