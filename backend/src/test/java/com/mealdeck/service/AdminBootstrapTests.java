package com.mealdeck.service;

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
        new AdminBootstrap(adminRepository, passwordEncoder, email, password, "owner@example.com").run();
    }

    @Test
    void createsTheFirstAdminOnceFromTheEnvironment() {
        bootstrap(" Admin@MealDeck.in ", "a-long-enough-password");

        var admins = adminRepository.findAll();
        assertThat(admins).hasSize(1);
        assertThat(admins.getFirst().getEmail()).isEqualTo("admin@mealdeck.in");
        assertThat(admins.getFirst().getRealEmail()).isEqualTo("owner@example.com");
        assertThat(passwordEncoder.matches("a-long-enough-password", admins.getFirst().getPasswordHash())).isTrue();

        bootstrap("second@mealdeck.in", "another-long-password");
        assertThat(adminRepository.count()).isEqualTo(1);
    }

    @Test
    void createsNothingWhenUnsetOffDomainOrWeak() {
        bootstrap("", "");
        bootstrap("boss@gmail.com", "a-long-enough-password");
        bootstrap("boss@mealdeck.in", "short");
        assertThat(adminRepository.count()).isZero();
    }
}
