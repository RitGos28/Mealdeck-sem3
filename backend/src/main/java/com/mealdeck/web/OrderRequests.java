package com.mealdeck.web;

import java.util.List;

public class OrderRequests {

    public record OrderItemRequest(Long menuItemId, int quantity) {
    }

    public record CreateOrderRequest(String customerName, String customerContact, List<OrderItemRequest> items) {
    }

    public record UpdateOrderStatusRequest(String status) {
    }

    private OrderRequests() {
    }
}
