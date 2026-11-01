package com.mealdeck.web;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** The numbers for a pitch, from real orders only (test accounts left out).
 * Percentages are whole numbers, null when there's nothing to divide by yet. */
public record PitchDto(
        LocalDate firstOrderDate,
        int students,
        int studentsJoinedThisWeek,
        int customers,
        int repeatCustomers,
        Integer repeatRate,
        int orders,
        int ordersThisWeek,
        BigDecimal orderValue,
        Integer collectedRate,
        Integer onTimeRate,
        int stallsTakingOrders,
        int stallsListed,
        int dishesListed,
        List<String> testAccounts,
        List<Day> lastTwoWeeks,
        List<StallLine> stalls,
        List<Dish> topDishes) {

    public record Day(LocalDate date, int orders) {
    }

    public record StallLine(String name, boolean takingOrders, int orders, int customers, BigDecimal orderValue, Integer onTimeRate) {
    }

    public record Dish(String name, String stall, int quantity) {
    }
}
