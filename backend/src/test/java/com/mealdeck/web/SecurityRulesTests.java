package com.mealdeck.web;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.mealdeck.FixedClockConfig;
import com.mealdeck.model.MenuItem;
import com.mealdeck.model.Stall;
import com.mealdeck.repository.StallRepository;
import com.mealdeck.repository.StudentRepository;
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
    void vendorEndpointsActOnlyOnTheCallersOwnStall() throws Exception {
        Stall snapEats = stall("SnapEats");
        MenuItem coffee = snapEats.getMenuItems().getFirst();
        Long studentId = studentRepository.findByEmail("student@bennett.edu.in").orElseThrow().getId();
        Long snapOrder = orderService.checkout(studentId, new CreateOrderRequest(
                List.of(new OrderItemRequest(coffee.getId(), 1)),
                Map.of(snapEats.getId(), LocalTime.of(12, 0)))).getFirst().getId();

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
                .andExpect(jsonPath("$[?(@.id == " + snapOrder + ")]").isEmpty());
    }

    @Test
    void unknownOrderStatusIsABadRequest() throws Exception {
        mvc.perform(patch("/api/vendor/orders/1/status").with(VENDOR)
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
