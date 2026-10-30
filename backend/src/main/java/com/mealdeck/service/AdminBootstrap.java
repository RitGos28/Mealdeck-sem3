package com.mealdeck.service;

import com.mealdeck.model.Admin;
import com.mealdeck.repository.AdminRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Creates the first admin from the environment when there is none, so a
 * fresh production database isn't locked out now that demo data is
 * demo-only. Does nothing once any admin exists: change the password from
 * the dashboard after that, not here. */
@Component
public class AdminBootstrap implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);
    static final int MIN_PASSWORD_LENGTH = 12;

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;
    private final String realEmail;

    public AdminBootstrap(
            AdminRepository adminRepository,
            PasswordEncoder passwordEncoder,
            @Value("${mealdeck.bootstrap-admin.email:}") String email,
            @Value("${mealdeck.bootstrap-admin.password:}") String password,
            @Value("${mealdeck.bootstrap-admin.real-email:}") String realEmail) {
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = email.strip().toLowerCase();
        this.password = password;
        this.realEmail = realEmail.strip();
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (adminRepository.count() > 0) {
            return;
        }
        if (email.isEmpty() || password.isEmpty()) {
            log.warn("No admin account exists. Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD and restart to create one.");
            return;
        }
        if (!email.endsWith(EmailDomains.STAFF_DOMAIN)) {
            log.error("BOOTSTRAP_ADMIN_EMAIL must end with {}; no admin created.", EmailDomains.STAFF_DOMAIN);
            return;
        }
        if (password.length() < MIN_PASSWORD_LENGTH) {
            log.error("BOOTSTRAP_ADMIN_PASSWORD must be at least {} characters; no admin created.", MIN_PASSWORD_LENGTH);
            return;
        }
        adminRepository.save(new Admin(email, passwordEncoder.encode(password), realEmail.isEmpty() ? null : realEmail));
        log.info("Created the first admin, {}.", email);
    }
}
