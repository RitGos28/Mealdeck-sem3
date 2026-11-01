package com.mealdeck.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.mealdeck.FixedClockConfig;
import com.mealdeck.RecordingCodeMailer;
import com.mealdeck.model.Admin;
import com.mealdeck.repository.AdminRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

/** The admin login: set from the environment, no password, an emailed
 * code each time. Password login is turned off here as in production. */
@SpringBootTest
@ActiveProfiles("demo")
@Import(FixedClockConfig.class)
@TestPropertySource(properties = "mealdeck.admin.password-login=false")
@Transactional
class AdminBootstrapTests {

    @Autowired AdminRepository adminRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired RecordingCodeMailer mailer;
    @Autowired WebApplicationContext context;

    @BeforeEach
    void noAdmins() {
        // One DELETE statement now, so re-saving admin@ can't hit the unique email.
        adminRepository.deleteAllInBatch();
        mailer.clear();
    }

    private void bootstrap(String email, String realEmail, boolean demoProfile) {
        new AdminBootstrap(adminRepository, passwordEncoder, email, realEmail, demoProfile).run();
    }

    @Test
    void createsTheAdminFromTheEnvironmentWithNoUsablePassword() {
        bootstrap(" Admin@MealDeck.in ", "owner@example.com", false);
        Admin admin = adminRepository.findByEmail("admin@mealdeck.in").orElseThrow();
        assertThat(admin.getRealEmail()).isEqualTo("owner@example.com");
        assertThat(passwordEncoder.matches("admin123", admin.getPasswordHash())).isFalse();
    }

    @Test
    void anExistingDemoAdminLosesItsPasswordAndGetsTheRealInbox() {
        adminRepository.save(new Admin("admin@mealdeck.in", passwordEncoder.encode("admin123"), "admin.owner@example.com"));
        bootstrap("admin@mealdeck.in", "owner@example.com", false);
        Admin admin = adminRepository.findByEmail("admin@mealdeck.in").orElseThrow();
        assertThat(passwordEncoder.matches("admin123", admin.getPasswordHash())).isFalse();
        assertThat(admin.getRealEmail()).isEqualTo("owner@example.com");
    }

    @Test
    void otherDemoAdminsAreRemovedOutsideTheDemoProfileOnly() {
        adminRepository.save(new Admin("demo@mealdeck.in", passwordEncoder.encode("admin123"), null));
        bootstrap("owner@mealdeck.in", "owner@example.com", true);
        assertThat(adminRepository.findByEmail("demo@mealdeck.in")).isPresent();
        bootstrap("", "", false);
        assertThat(adminRepository.findByEmail("demo@mealdeck.in")).isPresent();
        bootstrap("owner@mealdeck.in", "owner@example.com", false);
        assertThat(adminRepository.findByEmail("demo@mealdeck.in")).isEmpty();
    }

    @Test
    void createsNothingWhenUnsetOrOffDomain() {
        bootstrap("", "", false);
        bootstrap("boss@gmail.com", "owner@example.com", false);
        bootstrap("boss@mealdeck.in", "", false);
        assertThat(adminRepository.count()).isZero();
    }

    @Test
    void anAdminLogsInWithTheCodeSentToTheirRealInboxAndNotAPassword() throws Exception {
        adminRepository.save(new Admin("admin@mealdeck.in", passwordEncoder.encode("admin123"), "owner@example.com"));
        MockMvc mvc = MockMvcBuilders.webAppContextSetup(context).apply(SecurityMockMvcConfigurers.springSecurity()).build();

        mvc.perform(post("/api/auth/admin/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@mealdeck.in\",\"password\":\"admin123\"}"))
                .andExpect(status().isBadRequest());

        mvc.perform(post("/api/auth/admin/login/code").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"admin@mealdeck.in\"}"))
                .andExpect(status().isOk());
        String code = mailer.lastCodeFor("owner@example.com");
        assertThat(code).hasSize(6);

        mvc.perform(post("/api/auth/admin/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@mealdeck.in\",\"code\":\"000000\"}"))
                .andExpect(status().isBadRequest());
        MockHttpSession session = new MockHttpSession();
        mvc.perform(post("/api/auth/admin/login").session(session).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@mealdeck.in\",\"code\":\"" + code + "\"}"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/admin/stalls").session(session)).andExpect(status().isOk());

        // A code works once.
        mvc.perform(post("/api/auth/admin/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@mealdeck.in\",\"code\":\"" + code + "\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void askingForACodeSaysTheSameWhetherOrNotTheAdminExists() throws Exception {
        MockMvc mvc = MockMvcBuilders.webAppContextSetup(context).apply(SecurityMockMvcConfigurers.springSecurity()).build();
        mvc.perform(post("/api/auth/admin/login/code").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"nobody@mealdeck.in\"}"))
                .andExpect(status().isOk());
        assertThat(mailer.sentTo("nobody@mealdeck.in")).isFalse();
    }
}
