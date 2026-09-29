package com.mealdeck.web;

import com.mealdeck.model.Order;
import com.mealdeck.model.OrderItem;
import com.mealdeck.model.OrderStatus;
import com.mealdeck.service.OrderService;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record OrderDto(
        Long id,
        Long stallId,
        String stallName,
        String customerName,
        String customerContact,
        String status,
        Instant createdAt,
        LocalDate pickupDate,
        LocalTime pickupTime,
        Instant readyAt,
        /** When a READY order turns NO_SHOW if nobody collects it. */
        Instant noShowAt,
        BigDecimal total,
        List<Item> items) {

    public record Item(Long menuItemId, String menuItemName, int quantity, BigDecimal priceAtOrder) {

        static Item from(OrderItem item) {
            return new Item(item.getMenuItem().getId(), item.getMenuItem().getName(), item.getQuantity(), item.getPriceAtOrder());
        }
    }

    public static OrderDto from(Order order) {
        List<Item> items = order.getItems().stream().map(Item::from).toList();
        BigDecimal total = items.stream()
                .map(item -> item.priceAtOrder().multiply(BigDecimal.valueOf(item.quantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new OrderDto(
                order.getId(),
                order.getStall().getId(),
                order.getStall().getName(),
                order.getCustomerName(),
                order.getCustomerContact(),
                order.getStatus().name(),
                order.getCreatedAt(),
                order.getPickupDate(),
                order.getPickupTime(),
                order.getReadyAt(),
                order.getStatus() == OrderStatus.READY && order.getReadyAt() != null
                        ? order.getReadyAt().plus(OrderService.NO_SHOW_AFTER)
                        : null,
                total,
                items);
    }
}
