package com.mealdeck.web;

import com.mealdeck.model.MenuItem;
import com.mealdeck.model.Order;
import com.mealdeck.model.OrderStatus;
import com.mealdeck.model.Stall;
import com.mealdeck.model.Vendor;
import com.mealdeck.repository.VendorRepository;
import com.mealdeck.service.MenuService;
import com.mealdeck.service.OrderService;
import com.mealdeck.web.MenuItemRequests.CreateMenuItemRequest;
import com.mealdeck.web.MenuItemRequests.UpdateMenuItemRequest;
import com.mealdeck.web.MenuItemRequests.UpdateStallRequest;
import com.mealdeck.web.OrderRequests.UpdateOrderStatusRequest;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Everything here is scoped to the caller's own stall, resolved fresh from
 * the authenticated email on every request -- a vendor can never act on
 * another stall by guessing an id, because the id used for every lookup
 * comes from here, not from the request. */
@RestController
@RequestMapping("/api/vendor")
public class VendorController {

    private final VendorRepository vendorRepository;
    private final MenuService menuService;
    private final OrderService orderService;

    public VendorController(VendorRepository vendorRepository, MenuService menuService, OrderService orderService) {
        this.vendorRepository = vendorRepository;
        this.menuService = menuService;
        this.orderService = orderService;
    }

    @GetMapping("/stall")
    public StallDto stall(Authentication authentication) {
        return StallDto.from(menuService.getStallWithItems(ownStall(authentication).getId()));
    }

    @PatchMapping("/stall")
    public StallDto updateStall(Authentication authentication, @RequestBody UpdateStallRequest request) {
        Stall stall = ownStall(authentication);
        return StallDto.from(menuService.updateStallHours(stall.getId(), request));
    }

    @PostMapping("/menu-items")
    public MenuItemDto addItem(Authentication authentication, @RequestBody CreateMenuItemRequest request) {
        MenuItem item = menuService.addItem(ownStall(authentication).getId(), request);
        return MenuItemDto.from(item);
    }

    @PatchMapping("/menu-items/{id}")
    public MenuItemDto updateItem(Authentication authentication, @PathVariable Long id, @RequestBody UpdateMenuItemRequest request) {
        MenuItem item = menuService.updateItem(ownStall(authentication).getId(), id, request);
        return MenuItemDto.from(item);
    }

    @DeleteMapping("/menu-items/{id}")
    public void deleteItem(Authentication authentication, @PathVariable Long id) {
        menuService.deleteItem(ownStall(authentication).getId(), id);
    }

    @GetMapping("/orders")
    public List<OrderDto> orders(Authentication authentication) {
        return orderService.ordersForStall(ownStall(authentication).getId()).stream().map(OrderDto::from).toList();
    }

    @PatchMapping("/orders/{id}/status")
    public OrderDto updateOrderStatus(Authentication authentication, @PathVariable Long id, @RequestBody UpdateOrderStatusRequest request) {
        OrderStatus next = parseStatus(request.status());
        Order order = orderService.advanceStatus(ownStall(authentication).getId(), id, next);
        return OrderDto.from(order);
    }

    private Stall ownStall(Authentication authentication) {
        Vendor vendor = vendorRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return vendor.getStall();
    }

    private OrderStatus parseStatus(String value) {
        try {
            return OrderStatus.valueOf(value);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown status " + value);
        }
    }
}
