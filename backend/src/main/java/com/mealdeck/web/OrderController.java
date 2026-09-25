package com.mealdeck.web;

import com.mealdeck.model.Order;
import com.mealdeck.service.OrderService;
import com.mealdeck.web.OrderRequests.CreateOrderRequest;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/** Guest checkout: no login needed to place or look up a preorder, matching
 * the rest of the app (reporting is anonymous too, for now). */
@RestController
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/api/orders")
    public List<OrderDto> checkout(@RequestBody CreateOrderRequest request) {
        List<Order> orders = orderService.checkout(request);
        return orders.stream().map(OrderDto::from).toList();
    }

    @GetMapping("/api/orders/{id}")
    public OrderDto getOrder(@PathVariable Long id) {
        return OrderDto.from(orderService.getOrder(id));
    }
}
