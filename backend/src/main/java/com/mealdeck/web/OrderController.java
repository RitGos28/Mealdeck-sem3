package com.mealdeck.web;

import com.mealdeck.model.Order;
import com.mealdeck.repository.StudentRepository;
import com.mealdeck.repository.VendorRepository;
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
 * code needs a login too, and only shows the order to the student who
 * placed it, that stall's vendor, or an admin: ids are sequential and the
 * order carries the student's name and contact. */
@RestController
public class OrderController {

    private final OrderService orderService;
    private final QueueService queueService;
    private final StudentRepository studentRepository;
    private final VendorRepository vendorRepository;

    public OrderController(OrderService orderService, QueueService queueService,
            StudentRepository studentRepository, VendorRepository vendorRepository) {
        this.orderService = orderService;
        this.queueService = queueService;
        this.studentRepository = studentRepository;
        this.vendorRepository = vendorRepository;
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

    /** Looked up by the order's public code, not its id. Someone else's
     * order answers 404, same as a missing one, so the endpoint doesn't
     * confirm which codes exist. */
    @GetMapping("/api/orders/{code}")
    public OrderDto getOrder(Authentication authentication, @PathVariable String code) {
        Order order = orderService.getOrderByCode(code);
        if (!canSee(authentication, order)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No such order");
        }
        return OrderDto.from(order);
    }

    private boolean canSee(Authentication authentication, Order order) {
        String email = authentication.getName();
        if (hasRole(authentication, "ROLE_ADMIN")) {
            return true;
        }
        if (hasRole(authentication, "ROLE_VENDOR")) {
            return vendorRepository.findByEmail(email)
                    .map(vendor -> vendor.getStall().getId().equals(order.getStall().getId()))
                    .orElse(false);
        }
        return order.getStudent() != null && order.getStudent().getEmail().equals(email);
    }

    private static boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream().anyMatch(authority -> authority.getAuthority().equals(role));
    }
}
