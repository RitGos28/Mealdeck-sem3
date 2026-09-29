package com.mealdeck.web;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;

public class OrderRequests {

    public record OrderItemRequest(Long menuItemId, int quantity) {
    }

    /** pickupTimes maps each stall id in the cart to its chosen slot start
     * ("12:30"), since a multi-stall cart becomes one order per stall. */
    public record CreateOrderRequest(
            String customerName,
            String customerContact,
            List<OrderItemRequest> items,
            Map<Long, LocalTime> pickupTimes) {
    }

    public record UpdateOrderStatusRequest(String status) {
    }

    private OrderRequests() {
    }
}
