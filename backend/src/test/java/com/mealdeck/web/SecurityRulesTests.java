package com.mealdeck.web;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.mealdeck.FixedClockConfig;
import com.mealdeck.model.MenuItem;
import com.mealdeck.model.Order;
import com.mealdeck.model.Stall;
import com.mealdeck.model.Student;
import com.mealdeck.model.Vendor;
import com.mealdeck.repository.StallRepository;
import com.mealdeck.repository.StudentRepository;
import com.mealdeck.repository.VendorRepository;
import com.mealdeck.service.OrderService;
import com.mealdeck.web.OrderRequests.CreateOrderRequest;
import com.mealdeck.web.OrderRequests.OrderItemRequest;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

/** The URL rules in SecurityConfig, the role check on each login form, and
 * the vendor endpoints' own-stall scoping, through the real filter chain.
 * MockMvc is built by hand rather than with @AutoConfigureMockMvc so this
 * class reuses the service tests' cached context. Requests run on the test
 * thread, so their writes roll back with the test transaction. */
@SpringBootTest
@ActiveProfiles("demo")
@Import(FixedClockConfig.class)
@Transactional
class SecurityRulesTests {

    // Seeded by DemoDataSeeder; the bistro vendor owns Bistro / Kathi.
    private static final RequestPostProcessor VENDOR = user("bistro@mealdeck.in").roles("VENDOR");
    private static final RequestPostProcessor ADMIN = user("admin@mealdeck.in").roles("ADMIN");
    private static final RequestPostProcessor STUDENT = user("student@bennett.edu.in").roles("STUDENT");

    @Autowired
    WebApplicationContext context;

    @Autowired
    StallRepository stallRepository;

    @Autowired
    OrderService orderService;

    @Autowired
    StudentRepository studentRepository;

    @Autowired
    VendorRepository vendorRepository;

    MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(SecurityMockMvcConfigurers.springSecurity()).build();
    }

    private Stall stall(String name) {
        return stallRepository.findAllWithMenuItems().stream()
                .filter(s -> s.getName().equals(name)).findFirst().orElseThrow();
    }

    @Test
    void vendorRoutesNeedTheVendorRole() throws Exception {
        mvc.perform(get("/api/vendor/orders")).andExpect(status().isForbidden());
        mvc.perform(get("/api/vendor/orders").with(STUDENT)).andExpect(status().isForbidden());
        mvc.perform(get("/api/vendor/orders").with(ADMIN)).andExpect(status().isForbidden());
        mvc.perform(get("/api/vendor/orders").with(VENDOR)).andExpect(status().isOk());
    }

    @Test
    void adminRoutesNeedTheAdminRole() throws Exception {
        mvc.perform(get("/api/admin/orders")).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/orders").with(STUDENT)).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/orders").with(VENDOR)).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/orders").with(ADMIN)).andExpect(status().isOk());
    }

    @Test
    void onlyStudentsCanReportAnItem() throws Exception {
        Long itemId = stall("Bistro / Kathi").getMenuItems().getFirst().getId();
        String url = "/api/menu-items/" + itemId + "/report";

        mvc.perform(post(url)).andExpect(status().isForbidden());
        mvc.perform(post(url).with(VENDOR)).andExpect(status().isForbidden());
        mvc.perform(post(url).with(ADMIN)).andExpect(status().isForbidden());
        mvc.perform(post(url).with(STUDENT)).andExpect(status().isOk());
    }

    @Test
    void guestsCanBrowseButOnlyStudentsCanOrder() throws Exception {
        Long bistroId = stall("Bistro / Kathi").getId();

        mvc.perform(get("/api/stalls")).andExpect(status().isOk());
        mvc.perform(get("/api/stalls/" + bistroId + "/slots")).andExpect(status().isOk());
        mvc.perform(get("/api/stalls/" + bistroId + "/queue")).andExpect(status().isOk());

        String emptyCart = "{\"items\":[]}";
        mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content(emptyCart))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/orders").with(VENDOR).contentType(MediaType.APPLICATION_JSON).content(emptyCart))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/orders").with(ADMIN).contentType(MediaType.APPLICATION_JSON).content(emptyCart))
                .andExpect(status().isForbidden());
        // A student gets past security to checkout's own validation.
        mvc.perform(post("/api/orders").with(STUDENT).contentType(MediaType.APPLICATION_JSON).content(emptyCart))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Cart is empty"));
    }

    @Test
    void orderChoicesArriveAsJsonAndAreChecked() throws Exception {
        // The picks map binds from JSON; a plain dish refuses any picks.
        Stall bistro = stall("Bistro / Kathi");
        Long itemId = bistro.getMenuItems().getFirst().getId();
        String body = "{\"items\":[{\"menuItemId\":" + itemId + ",\"quantity\":1,\"choices\":{\"Bread\":\"Naan\"}}],\"pickupTimes\":{\"" + bistro.getId() + "\":\"12:00\"}}";
        mvc.perform(post("/api/orders").with(STUDENT).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("has no choices to make")));
    }

    @Test
    void vendorEndpointsActOnlyOnTheCallersOwnStall() throws Exception {
        Stall snapEats = stall("SnapEats");
        MenuItem coffee = snapEats.getMenuItems().getFirst();
        Long studentId = studentRepository.findByEmail("student@bennett.edu.in").orElseThrow().getId();
        String snapOrder = orderService.checkout(studentId, new CreateOrderRequest(
                List.of(new OrderItemRequest(coffee.getId(), 1)),
                Map.of(snapEats.getId(), LocalTime.of(12, 0)))).getFirst().getPublicCode();

        mvc.perform(patch("/api/vendor/menu-items/" + coffee.getId()).with(VENDOR)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"available\":false}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("That item belongs to another stall"));
        mvc.perform(patch("/api/vendor/orders/" + snapOrder + "/status").with(VENDOR)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"ACCEPTED\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("That order belongs to another stall"));
        mvc.perform(get("/api/vendor/orders").with(VENDOR))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.code == '" + snapOrder + "')]").isEmpty());
    }

    @Test
    void orderDetailsOnlyShowToTheStudentTheStallAndAdmins() throws Exception {
        Stall bistro = stall("Bistro / Kathi");
        Long studentId = studentRepository.findByEmail("student@bennett.edu.in").orElseThrow().getId();
        Order order = orderService.checkout(studentId, new CreateOrderRequest(
                List.of(new OrderItemRequest(bistro.getMenuItems().getFirst().getId(), 1)),
                Map.of(bistro.getId(), LocalTime.of(12, 0)))).getFirst();
        String url = "/api/orders/" + order.getPublicCode();
        vendorRepository.save(new Vendor("snapeats@mealdeck.in", "unused", "snapeats@example.com", stall("SnapEats")));

        mvc.perform(get(url)).andExpect(status().isForbidden());
        mvc.perform(get(url).with(STUDENT))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(order.getId()))
                .andExpect(jsonPath("$.code").value(order.getPublicCode()))
                .andExpect(jsonPath("$.customerName").value("Demo Student"));
        mvc.perform(get(url).with(VENDOR)).andExpect(status().isOk());
        mvc.perform(get(url).with(ADMIN)).andExpect(status().isOk());
        // Another student, or another stall's vendor, gets the same 404 as a
        // missing order, so order numbers can't be probed.
        mvc.perform(get(url).with(user("someone.else@bennett.edu.in").roles("STUDENT")))
                .andExpect(status().isNotFound());
        mvc.perform(get(url).with(user("snapeats@mealdeck.in").roles("VENDOR")))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/orders/ZZZZZZZZZZZZ").with(STUDENT)).andExpect(status().isNotFound());
        // The sequential id no longer opens an order, even for its owner.
        mvc.perform(get("/api/orders/" + order.getId()).with(STUDENT)).andExpect(status().isNotFound());
    }

    @Test
    void myOrdersListsOnlyTheLoggedInStudentsOwnOrders() throws Exception {
        Stall bistro = stall("Bistro / Kathi");
        Long studentId = studentRepository.findByEmail("student@bennett.edu.in").orElseThrow().getId();
        Long otherId = studentRepository.save(new Student("other.student@bennett.edu.in", "unused", "Other Student", null)).getId();
        CreateOrderRequest oneRoll = new CreateOrderRequest(
                List.of(new OrderItemRequest(bistro.getMenuItems().getFirst().getId(), 1)), Map.of(bistro.getId(), LocalTime.of(12, 0)));
        Order mine = orderService.checkout(studentId, oneRoll).getFirst();
        Order theirs = orderService.checkout(otherId, oneRoll).getFirst();

        mvc.perform(get("/api/orders")).andExpect(status().isForbidden());
        mvc.perform(get("/api/orders").with(VENDOR)).andExpect(status().isForbidden());
        mvc.perform(get("/api/orders").with(ADMIN)).andExpect(status().isForbidden());
        mvc.perform(get("/api/orders").with(STUDENT))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.code == '" + mine.getPublicCode() + "')]").isNotEmpty())
                .andExpect(jsonPath("$[?(@.code == '" + theirs.getPublicCode() + "')]").isEmpty());
    }

    @Test
    void vendorOrderHistoryTakesADate() throws Exception {
        mvc.perform(get("/api/vendor/orders").param("date", "2026-09-28").with(VENDOR))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
        mvc.perform(get("/api/vendor/orders").param("date", "2026-09-30").with(VENDOR))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/vendor/orders").param("date", "yesterday").with(VENDOR))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unknownOrderStatusIsABadRequest() throws Exception {
        mvc.perform(patch("/api/vendor/orders/ZZZZZZZZZZZZ/status").with(VENDOR)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"EATEN\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void eachLoginFormOnlyAcceptsItsOwnRole() throws Exception {
        String vendorCreds = "{\"email\":\"bistro@mealdeck.in\",\"password\":\"vendor123\"}";

        mvc.perform(post("/api/auth/vendor/login").contentType(MediaType.APPLICATION_JSON).content(vendorCreds))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("VENDOR"))
                .andExpect(jsonPath("$.stallId").value(stall("Bistro / Kathi").getId()));
        // A correct vendor password must not open the admin or student forms.
        mvc.perform(post("/api/auth/admin/login").contentType(MediaType.APPLICATION_JSON).content(vendorCreds))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/student/login").contentType(MediaType.APPLICATION_JSON).content(vendorCreds))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/vendor/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"bistro@mealdeck.in\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized());
    }
}
