package com.mealdeck.web;

import com.mealdeck.model.MenuItem;
import com.mealdeck.model.Order;
import com.mealdeck.model.OrderStatus;
import com.mealdeck.service.AdminAccountService;
import com.mealdeck.service.AnalyticsService;
import com.mealdeck.service.MenuService;
import com.mealdeck.service.OrderService;
import com.mealdeck.service.StudentService;
import com.mealdeck.web.AdminUserRequests.CreateStudentRequest;
import com.mealdeck.web.AdminUserRequests.UpdateStudentRequest;
import com.mealdeck.web.AdminUserRequests.UpdateVendorRequest;
import com.mealdeck.web.MenuItemRequests.CreateMenuItemRequest;
import com.mealdeck.web.MenuItemRequests.CreateStallRequest;
import com.mealdeck.web.MenuItemRequests.UpdateMenuItemRequest;
import com.mealdeck.web.MenuItemRequests.UpdateStallRequest;
import com.mealdeck.web.OrderRequests.UpdateOrderStatusRequest;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Same shape as VendorController, but every method takes the stall id from
 * the request/path instead of resolving it from the caller -- an admin is
 * allowed to touch any stall. */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final MenuService menuService;
    private final OrderService orderService;
    private final AnalyticsService analyticsService;
    private final AdminAccountService adminAccountService;
    private final StudentService studentService;

    public AdminController(MenuService menuService, OrderService orderService, AnalyticsService analyticsService, AdminAccountService adminAccountService, StudentService studentService) {
        this.menuService = menuService;
        this.orderService = orderService;
        this.analyticsService = analyticsService;
        this.adminAccountService = adminAccountService;
        this.studentService = studentService;
    }

    @GetMapping("/stalls")
    public List<StallDto> stalls() {
        return menuService.listStalls().stream().map(StallDto::from).toList();
    }

    @PostMapping("/stalls")
    public StallDto createStall(@RequestBody CreateStallRequest request) {
        Long stallId = adminAccountService.createStallWithVendor(request).getStall().getId();
        return StallDto.from(menuService.getStallWithItems(stallId));
    }

    @PatchMapping("/stalls/{id}")
    public StallDto updateStall(@PathVariable Long id, @RequestBody UpdateStallRequest request) {
        return StallDto.from(menuService.updateStall(id, request));
    }

    @PostMapping("/stalls/{stallId}/menu-items")
    public MenuItemDto addItem(@PathVariable Long stallId, @RequestBody CreateMenuItemRequest request) {
        MenuItem item = menuService.addItem(stallId, request);
        return MenuItemDto.from(item);
    }

    @PatchMapping("/stalls/{stallId}/menu-items/{id}")
    public MenuItemDto updateItem(@PathVariable Long stallId, @PathVariable Long id, @RequestBody UpdateMenuItemRequest request) {
        MenuItem item = menuService.updateItem(stallId, id, request);
        return MenuItemDto.from(item);
    }

    @DeleteMapping("/stalls/{stallId}/menu-items/{id}")
    public void deleteItem(@PathVariable Long stallId, @PathVariable Long id) {
        menuService.deleteItem(stallId, id);
    }

    @GetMapping("/orders")
    public List<OrderDto> orders() {
        return orderService.allOrders().stream().map(OrderDto::from).toList();
    }

    @PatchMapping("/stalls/{stallId}/orders/{code}/status")
    public OrderDto updateOrderStatus(@PathVariable Long stallId, @PathVariable String code, @RequestBody UpdateOrderStatusRequest request) {
        OrderStatus next = parseStatus(request.status());
        Order order = orderService.advanceStatus(stallId, orderService.getOrderByCode(code).getId(), next);
        return OrderDto.from(order);
    }

    @GetMapping("/analytics")
    public AnalyticsDto analytics() {
        return analyticsService.summarize();
    }

    @GetMapping("/vendors")
    public List<VendorAccountDto> vendors() { return adminAccountService.listVendors().stream().map(VendorAccountDto::from).toList(); }

    @PatchMapping("/vendors/{id}")
    public VendorAccountDto updateVendor(@PathVariable Long id, @RequestBody UpdateVendorRequest request) { return VendorAccountDto.from(adminAccountService.updateVendor(id, request)); }

    @DeleteMapping("/vendors/{id}")
    public void deleteVendor(@PathVariable Long id) { adminAccountService.deleteVendor(id); }

    @GetMapping("/students")
    public List<StudentAccountDto> students() { return studentService.list().stream().map(StudentAccountDto::from).toList(); }

    @PostMapping("/students")
    public StudentAccountDto createStudent(@RequestBody CreateStudentRequest request) { return StudentAccountDto.from(studentService.createByAdmin(request)); }

    @PatchMapping("/students/{id}")
    public StudentAccountDto updateStudent(@PathVariable Long id, @RequestBody UpdateStudentRequest request) { return StudentAccountDto.from(studentService.updateByAdmin(id, request)); }

    @DeleteMapping("/students/{id}")
    public void deleteStudent(@PathVariable Long id) { studentService.deleteByAdmin(id); }

    private OrderStatus parseStatus(String value) {
        try {
            return OrderStatus.valueOf(value);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown status " + value);
        }
    }
}
