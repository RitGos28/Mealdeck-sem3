package com.mealdeck.web;

import com.mealdeck.model.Order;
import com.mealdeck.repository.StudentRepository;
import com.mealdeck.service.OrderService;
import com.mealdeck.service.QueueService;
import com.mealdeck.web.OrderRequests.CreateOrderRequest;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/** Placing a pre-order needs a student login (SecurityConfig); the order
 * takes its name and contact from that account. Looking an order up by
 * number stays open, for the confirmation page. */
@RestController
public class OrderController {

    private final OrderService orderService;
    private final QueueService queueService;
    private final StudentRepository studentRepository;

    public OrderController(OrderService orderService, QueueService queueService, StudentRepository studentRepository) {
        this.orderService = orderService;
        this.queueService = queueService;
        this.studentRepository = studentRepository;
    }

    @GetMapping("/api/stalls/{id}/slots")
    public List<SlotDto> slots(@PathVariable Long id) {
        return queueService.slots(id);
    }

    /** First render of the live queue; later changes arrive over the
     * /api/ws socket on /topic/stalls/{id}/queue (see QueueBroadcaster). */
    @GetMapping("/api/stalls/{id}/queue")
    public QueueSnapshot queue(@PathVariable Long id) {
        return queueService.snapshot(id);
    }

    @PostMapping("/api/orders")
    public List<OrderDto> checkout(Authentication authentication, @RequestBody CreateOrderRequest request) {
        Long studentId = studentRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Log in as a student to order"))
                .getId();
        List<Order> orders = orderService.checkout(studentId, request);
        return orders.stream().map(OrderDto::from).toList();
    }

    @GetMapping("/api/orders/{id}")
    public OrderDto getOrder(@PathVariable Long id) {
        return OrderDto.from(orderService.getOrder(id));
    }
}
