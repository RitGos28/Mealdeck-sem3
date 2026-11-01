package com.mealdeck.service;

import com.mealdeck.model.Admin;
import com.mealdeck.repository.AdminRepository;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** The admin login comes from the environment (ADMIN_EMAIL, ADMIN_PASSWORD,
 * optional ADMIN_REAL_EMAIL). On every start that admin is created, or
 * its password set to match, so the env file is the one place to change
 * it. Then, outside the demo profile, any admin still using the public
 * demo password (admin123, from DemoDataSeeder) is removed: production
 * must never keep it, and it's only removed once the env admin exists. */
@Component
public class AdminBootstrap implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);
    static final int MIN_PASSWORD_LENGTH = 12;
    static final String PUBLIC_DEMO_PASSWORD = "admin123";

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;
    private final String realEmail;
    private final boolean demoProfile;

    public AdminBootstrap(
            AdminRepository adminRepository,
            PasswordEncoder passwordEncoder,
            @Value("${mealdeck.admin.email:}") String email,
            @Value("${mealdeck.admin.password:}") String password,
            @Value("${mealdeck.admin.real-email:}") String realEmail,
            @Value("#{environment.matchesProfiles('demo')}") boolean demoProfile) {
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = email.strip().toLowerCase();
        this.password = password;
        this.realEmail = realEmail.strip();
        this.demoProfile = demoProfile;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (email.isEmpty() || password.isEmpty()) {
            if (!demoProfile) log.warn("ADMIN_EMAIL / ADMIN_PASSWORD aren't set, so the admin login isn't managed from the environment.");
            return;
        }
        if (!email.endsWith(EmailDomains.STAFF_DOMAIN)) {
            log.error("ADMIN_EMAIL must end with {}; admin login left unchanged.", EmailDomains.STAFF_DOMAIN);
            return;
        }
        if (password.length() < MIN_PASSWORD_LENGTH) {
            log.error("ADMIN_PASSWORD must be at least {} characters; admin login left unchanged.", MIN_PASSWORD_LENGTH);
            return;
        }
        Admin admin = adminRepository.findByEmail(email).orElse(null);
        if (admin == null) {
            adminRepository.save(new Admin(email, passwordEncoder.encode(password), realEmail.isEmpty() ? null : realEmail));
            log.info("Created the admin {} from the environment.", email);
        } else if (!passwordEncoder.matches(password, admin.getPasswordHash())) {
            admin.setPasswordHash(passwordEncoder.encode(password));
            log.info("Set the password of {} from the environment.", email);
        }
        if (!demoProfile) {
            List<Admin> leftovers = adminRepository.findAll().stream()
                    .filter(other -> !other.getEmail().equals(email))
                    .filter(other -> passwordEncoder.matches(PUBLIC_DEMO_PASSWORD, other.getPasswordHash()))
                    .toList();
            leftovers.forEach(other -> log.warn("Removed the admin {}: it still had the public demo password.", other.getEmail()));
            adminRepository.deleteAll(leftovers);
        }
    }
}
