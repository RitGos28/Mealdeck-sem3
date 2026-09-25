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

    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;

    public OrderService(OrderRepository orderRepository, MenuItemRepository menuItemRepository) {
        this.orderRepository = orderRepository;
        this.menuItemRepository = menuItemRepository;
    }

    /** A cart can hold items from several stalls; each vendor must only ever
     * see their own orders, so checkout splits the cart into one Order per
     * stall here and returns all of them together for one confirmation. */
    @Transactional
    public List<Order> checkout(CreateOrderRequest request) {
        if (request.items() == null || request.items().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart is empty");
        }

        Map<Stall, Order> ordersByStall = new LinkedHashMap<>();
        for (OrderItemRequest line : request.items()) {
            if (line.quantity() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be positive");
            }
            MenuItem item = menuItemRepository.findById(line.menuItemId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "No menu item " + line.menuItemId()));
            if (!item.isAvailable()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, item.getName() + " is out of stock");
            }

            Order order = ordersByStall.computeIfAbsent(item.getStall(),
                    stall -> new Order(stall, request.customerName(), request.customerContact()));
            order.addItem(new OrderItem(order, item, line.quantity(), item.getPrice()));
        }

        List<Order> orders = new ArrayList<>(ordersByStall.values());
        return orderRepository.saveAll(orders);
    }

    public List<Order> ordersForStall(Long stallId) {
        return orderRepository.findByStallIdWithItems(stallId);
    }

    public List<Order> allOrders() {
        return orderRepository.findAllWithItems();
    }

    public Order getOrder(Long id) {
        return orderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No order " + id));
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
        return order;
    }
}
