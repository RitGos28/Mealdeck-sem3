package com.mealdeck.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.mealdeck.FixedClockConfig;
import com.mealdeck.model.MenuItem;
import com.mealdeck.model.Stall;
import com.mealdeck.model.Student;
import com.mealdeck.repository.StallRepository;
import com.mealdeck.repository.StudentRepository;
import com.mealdeck.web.MenuItemRequests.UpdateStallRequest;
import com.mealdeck.web.OrderRequests.CreateOrderRequest;
import com.mealdeck.web.OrderRequests.OrderItemRequest;
import com.mealdeck.web.PitchDto;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.server.ResponseStatusException;

/** Pilot launch: browse-only stalls, and pitch numbers from real students. */
@SpringBootTest
@ActiveProfiles("demo")
@Import(FixedClockConfig.class)
@Transactional
class PilotLaunchTests {

    @Autowired MenuService menuService;
    @Autowired OrderService orderService;
    @Autowired PitchService pitchService;
    @Autowired StallRepository stallRepository;
    @Autowired StudentRepository studentRepository;
    @Autowired WebApplicationContext context;

    private Stall stall(String name) {
        return stallRepository.findAllWithMenuItems().stream().filter(s -> s.getName().equals(name)).findFirst().orElseThrow();
    }

    private void order(Student student, Stall stall) {
        MenuItem item = stall.getMenuItems().getFirst();
        orderService.checkout(student.getId(), new CreateOrderRequest(List.of(new OrderItemRequest(item.getId(), 2)), Map.of(stall.getId(), LocalTime.NOON)));
    }

    @Test
    void aBrowseOnlyStallKeepsItsMenuButTakesNoOrders() {
        Stall bistro = stall("Bistro / Kathi");
        menuService.updateStall(bistro.getId(), new UpdateStallRequest(null, null, null, null, null, true));
        Student student = studentRepository.findByEmail("student@bennett.edu.in").orElseThrow();

        assertThat(stall("Bistro / Kathi").getMenuItems()).isNotEmpty();
        assertThatThrownBy(() -> order(student, bistro))
                .isInstanceOfSatisfying(ResponseStatusException.class, e -> assertThat(e.getReason()).contains("isn't taking pre-orders yet"));

        menuService.updateStall(bistro.getId(), new UpdateStallRequest(null, null, null, null, null, false));
        order(student, bistro);
    }

    @Test
    void onlyAnAdminDecidesWhetherAStallTakesPreOrders() throws Exception {
        var mvc = MockMvcBuilders.webAppContextSetup(context).apply(SecurityMockMvcConfigurers.springSecurity()).build();
        mvc.perform(patch("/api/vendor/stall").with(user("bistro@mealdeck.in").roles("VENDOR"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"listingOnly\":false}"))
                .andExpect(status().isForbidden());
        mvc.perform(patch("/api/admin/stalls/" + stall("Bistro / Kathi").getId()).with(user("admin@mealdeck.in").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"listingOnly\":true}"))
                .andExpect(status().isOk());
        assertThat(stall("Bistro / Kathi").isListingOnly()).isTrue();
    }

    @Test
    void pitchNumbersLeaveOutTestAccounts() {
        Stall bistro = stall("Bistro / Kathi");
        PitchDto before = pitchService.summarize();

        // The demo student is a test account: their orders don't count.
        order(studentRepository.findByEmail("student@bennett.edu.in").orElseThrow(), bistro);
        Student real = studentRepository.save(new Student("pilot.tester@bennett.edu.in", "x", "Pilot Tester", null));
        order(real, bistro);
        order(real, bistro);

        PitchDto after = pitchService.summarize();
        assertThat(after.testAccounts()).contains("student@bennett.edu.in");
        assertThat(after.orders() - before.orders()).isEqualTo(2);
        assertThat(after.customers() - before.customers()).isEqualTo(1);
        assertThat(after.students() - before.students()).isEqualTo(1);
        // Both orders were the same day, so not a repeat customer yet.
        assertThat(after.repeatCustomers()).isEqualTo(before.repeatCustomers());
        assertThat(after.topDishes()).isNotEmpty();
        assertThat(after.lastTwoWeeks()).hasSize(14);
    }
}
