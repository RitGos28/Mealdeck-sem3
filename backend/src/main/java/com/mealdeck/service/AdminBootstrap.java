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

/** The admin login comes from the environment: ADMIN_EMAIL (the login,
 * @mealdeck.in) and ADMIN_REAL_EMAIL (the inbox its login codes go to).
 * Admins have no password: each login is an emailed code (AuthController).
 * On every start that admin is created or updated to match, with a random
 * password nobody knows. Then, outside the demo profile, any admin still
 * on the public demo password (admin123, from DemoDataSeeder) is removed;
 * only once the env admin exists, so there's always a way in. */
@Component
public class AdminBootstrap implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);
    static final String PUBLIC_DEMO_PASSWORD = "admin123";

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String realEmail;
    private final boolean demoProfile;

    public AdminBootstrap(
            AdminRepository adminRepository,
            PasswordEncoder passwordEncoder,
            @Value("${mealdeck.admin.email:}") String email,
            @Value("${mealdeck.admin.real-email:}") String realEmail,
            @Value("#{environment.matchesProfiles('demo')}") boolean demoProfile) {
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = email.strip().toLowerCase();
        this.realEmail = realEmail.strip();
        this.demoProfile = demoProfile;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (email.isEmpty() || realEmail.isEmpty()) {
            if (!demoProfile) log.warn("ADMIN_EMAIL / ADMIN_REAL_EMAIL aren't set, so there's no admin login from the environment.");
            return;
        }
        if (!email.endsWith(EmailDomains.STAFF_DOMAIN)) {
            log.error("ADMIN_EMAIL must end with {}; admin login left unchanged.", EmailDomains.STAFF_DOMAIN);
            return;
        }
        Admin admin = adminRepository.findByEmail(email).orElse(null);
        if (admin == null) {
            admin = adminRepository.save(new Admin(email, unusablePassword(), realEmail));
            log.info("Created the admin {} from the environment; login codes go to its real inbox.", email);
        } else {
            // No password works for it any more (admin123 included): codes only.
            if (!demoProfile) admin.setPasswordHash(unusablePassword());
            admin.setRealEmail(realEmail);
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

    private String unusablePassword() {
        byte[] random = new byte[32];
        new java.security.SecureRandom().nextBytes(random);
        return passwordEncoder.encode(java.util.HexFormat.of().formatHex(random));
    }
}
