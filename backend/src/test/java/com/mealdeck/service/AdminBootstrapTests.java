package com.mealdeck.service;

import com.mealdeck.model.Admin;

import static org.assertj.core.api.Assertions.assertThat;

import com.mealdeck.repository.AdminRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("demo")
@Transactional
class AdminBootstrapTests {

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void noAdmins() {
        adminRepository.deleteAll();
    }

    private void bootstrap(String email, String password) {
        bootstrap(email, password, false);
    }

    private void bootstrap(String email, String password, boolean demoProfile) {
        new AdminBootstrap(adminRepository, passwordEncoder, email, password, "owner@example.com", demoProfile).run();
    }

    @Test
    void createsTheAdminFromTheEnvironment() {
        bootstrap(" Admin@MealDeck.in ", "a-long-enough-password");

        var admins = adminRepository.findAll();
        assertThat(admins).hasSize(1);
        assertThat(admins.getFirst().getEmail()).isEqualTo("admin@mealdeck.in");
        assertThat(admins.getFirst().getRealEmail()).isEqualTo("owner@example.com");
        assertThat(passwordEncoder.matches("a-long-enough-password", admins.getFirst().getPasswordHash())).isTrue();
    }

    @Test
    void theEnvironmentPasswordWinsOnEveryStart() {
        bootstrap("admin@mealdeck.in", "a-long-enough-password");
        bootstrap("admin@mealdeck.in", "a-new-long-password!");
        Admin admin = adminRepository.findByEmail("admin@mealdeck.in").orElseThrow();
        assertThat(passwordEncoder.matches("a-new-long-password!", admin.getPasswordHash())).isTrue();
        assertThat(adminRepository.count()).isEqualTo(1);
    }

    @Test
    void thePublicDemoAdminIsRemovedOutsideTheDemoProfile() {
        adminRepository.save(new Admin("demo@mealdeck.in", passwordEncoder.encode("admin123"), null));
        // Demo profile (tests, ./run.sh --demo): kept.
        bootstrap("owner@mealdeck.in", "a-long-enough-password", true);
        assertThat(adminRepository.findByEmail("demo@mealdeck.in")).isPresent();
        // Production: removed, and only once the env admin exists.
        bootstrap("", "");
        assertThat(adminRepository.findByEmail("demo@mealdeck.in")).isPresent();
        bootstrap("owner@mealdeck.in", "a-long-enough-password");
        assertThat(adminRepository.findByEmail("demo@mealdeck.in")).isEmpty();
        assertThat(adminRepository.findByEmail("owner@mealdeck.in")).isPresent();
    }

    @Test
    void createsNothingWhenUnsetOffDomainOrWeak() {
        bootstrap("", "");
        bootstrap("boss@gmail.com", "a-long-enough-password");
        bootstrap("boss@mealdeck.in", "short");
        assertThat(adminRepository.count()).isZero();
    }
}
