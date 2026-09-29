package com.mealdeck.web;

import com.mealdeck.model.Order;
import com.mealdeck.service.MenuService;
import com.mealdeck.service.OrderService;
import com.mealdeck.service.SlotService;
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
    private final SlotService slotService;
    private final MenuService menuService;

    public OrderController(OrderService orderService, SlotService slotService, MenuService menuService) {
        this.orderService = orderService;
        this.slotService = slotService;
        this.menuService = menuService;
    }

    @GetMapping("/api/stalls/{id}/slots")
    public List<SlotDto> slots(@PathVariable Long id) {
        return slotService.upcomingSlots(menuService.getStall(id)).stream().map(SlotDto::new).toList();
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
