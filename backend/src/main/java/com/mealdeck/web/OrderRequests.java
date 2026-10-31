package com.mealdeck.web;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;

public class OrderRequests {

    /** `choices` maps each of the dish's choice groups to the option picked
     * (e.g. Bread → "Butter Roti ×2"); omit it for dishes without choices.
     * The same dish can appear on several lines with different choices. */
    public record OrderItemRequest(Long menuItemId, int quantity, Map<String, String> choices) {
        public OrderItemRequest(Long menuItemId, int quantity) {
            this(menuItemId, quantity, null);
        }
    }

    /** pickupTimes maps each stall id in the cart to its chosen slot start
     * ("12:30"), since a multi-stall cart becomes one order per stall. No
     * name or contact: they come from the logged-in student's account. */
    public record CreateOrderRequest(
            List<OrderItemRequest> items,
            Map<Long, LocalTime> pickupTimes) {
    }

    public record UpdateOrderStatusRequest(String status) {
    }

    private OrderRequests() {
    }
}
