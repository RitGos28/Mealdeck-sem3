package com.mealdeck.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.mealdeck.FixedClockConfig;
import com.mealdeck.model.Stall;
import com.mealdeck.model.Vendor;
import com.mealdeck.repository.MenuItemRepository;
import com.mealdeck.repository.StallRepository;
import com.mealdeck.repository.StudentRepository;
import com.mealdeck.repository.VendorRepository;
import com.mealdeck.web.MenuItemRequests.CreateMenuItemRequest;
import com.mealdeck.web.MenuItemRequests.CreateStallRequest;
import com.mealdeck.web.OrderRequests.CreateOrderRequest;
import com.mealdeck.web.OrderRequests.OrderItemRequest;
import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Deleting a stall: allowed while it has no order history (taking its menu,
 * stock reports and vendor login with it), refused once anyone has ordered. */
@SpringBootTest
@ActiveProfiles("demo")
@Import(FixedClockConfig.class)
@Transactional
class StallDeletionTests {

    @Autowired
    AdminAccountService adminAccountService;

    @Autowired
    MenuService menuService;

    @Autowired
    MenuItemRepository menuItemRepository;

    @Autowired
    OrderService orderService;

    @Autowired
    StallRepository stallRepository;

    @Autowired
    StudentRepository studentRepository;

    @Autowired
    VendorRepository vendorRepository;

    @Test
    void aStallNobodyOrderedFromIsDeletedWithItsMenuAndVendor() {
        Vendor vendor = adminAccountService.createStallWithVendor(
                new CreateStallRequest("Typo Stall", "typo@mealdeck.in", "secret1", null));
        Long stallId = vendor.getStall().getId();
        Long itemId = menuService.addItem(stallId, new CreateMenuItemRequest("Chai", new BigDecimal("10"), true, null)).getId();
        menuService.reportOutOfStock(itemId, studentRepository.findByEmail("student@bennett.edu.in").orElseThrow().getId());

        adminAccountService.deleteStall(stallId);

        assertThat(stallRepository.findById(stallId)).isEmpty();
        assertThat(menuItemRepository.findById(itemId)).isEmpty();
        assertThat(vendorRepository.findById(vendor.getId())).isEmpty();
    }

    @Test
    void aStallWithOrderHistoryIsKept() {
        Stall bistro = stallRepository.findAllWithMenuItems().stream()
                .filter(s -> s.getName().equals("Bistro / Kathi")).findFirst().orElseThrow();
        Long studentId = studentRepository.findByEmail("student@bennett.edu.in").orElseThrow().getId();
        orderService.checkout(studentId, new CreateOrderRequest(
                List.of(new OrderItemRequest(bistro.getMenuItems().getFirst().getId(), 1)), Map.of(bistro.getId(), LocalTime.NOON)));

        assertThatThrownBy(() -> adminAccountService.deleteStall(bistro.getId()))
                .isInstanceOfSatisfying(ResponseStatusException.class, e -> {
                    assertThat(e.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(e.getReason()).contains("1 past order");
                });
        assertThat(stallRepository.findById(bistro.getId())).isPresent();
    }

    @Test
    void deletingAMissingStallIs404() {
        assertThatThrownBy(() -> adminAccountService.deleteStall(-1L))
                .isInstanceOfSatisfying(ResponseStatusException.class, e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }
}
