package com.mealdeck.service;

import com.mealdeck.model.Admin;
import com.mealdeck.model.MenuItem;
import com.mealdeck.model.Stall;
import com.mealdeck.model.Vendor;
import com.mealdeck.repository.AdminRepository;
import com.mealdeck.repository.MenuItemRepository;
import com.mealdeck.repository.StallRepository;
import com.mealdeck.repository.VendorRepository;
import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Seeds a couple of stalls, plus a working vendor and admin login, once on
 * first boot if the DB is empty -- so ./run.sh --demo is testable end to
 * end with no signup flow. Credentials are also in README.md. */
@Component
public class DemoDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    private static final String VENDOR_EMAIL = "bistro@mealdeck.demo";
    private static final String VENDOR_PASSWORD = "vendor123";
    private static final String ADMIN_EMAIL = "admin@mealdeck.demo";
    private static final String ADMIN_PASSWORD = "admin123";

    private final StallRepository stallRepository;
    private final MenuItemRepository menuItemRepository;
    private final VendorRepository vendorRepository;
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoDataSeeder(
            StallRepository stallRepository,
            MenuItemRepository menuItemRepository,
            VendorRepository vendorRepository,
            AdminRepository adminRepository,
            PasswordEncoder passwordEncoder) {
        this.stallRepository = stallRepository;
        this.menuItemRepository = menuItemRepository;
        this.vendorRepository = vendorRepository;
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (stallRepository.count() > 0) {
            return;
        }

        List<Stall> stalls = stallRepository.saveAll(
                List.of(new Stall("Bistro / Kathi"), new Stall("SnapEats"), new Stall("Quench")));
        Stall bistro = stalls.get(0);
        Stall snapEats = stalls.get(1);
        Stall quench = stalls.get(2);

        bistro.setOpenTime(LocalTime.of(8, 0));
        bistro.setCloseTime(LocalTime.of(20, 0));
        snapEats.setOpenTime(LocalTime.of(9, 0));
        snapEats.setCloseTime(LocalTime.of(22, 0));
        quench.setOpenTime(LocalTime.of(8, 0));
        quench.setCloseTime(LocalTime.of(18, 0));
        stallRepository.saveAll(List.of(bistro, snapEats, quench));

        menuItemRepository.saveAll(List.of(
                new MenuItem(bistro, "Paneer Kathi Roll", new BigDecimal("129"), true),
                new MenuItem(bistro, "Chicken Kathi Roll", new BigDecimal("149"), false),
                new MenuItem(bistro, "Veg Sandwich", new BigDecimal("79"), true),
                new MenuItem(snapEats, "Cold Coffee", new BigDecimal("69"), true),
                new MenuItem(snapEats, "Chicken Burger", new BigDecimal("139"), false),
                new MenuItem(quench, "Fresh Lime Soda", new BigDecimal("59"), true),
                new MenuItem(quench, "Oreo Shake", new BigDecimal("109"), true)));

        vendorRepository.save(new Vendor(VENDOR_EMAIL, passwordEncoder.encode(VENDOR_PASSWORD), bistro));
        adminRepository.save(new Admin(ADMIN_EMAIL, passwordEncoder.encode(ADMIN_PASSWORD)));

        log.info("Seeded demo accounts -- vendor: {} / {} (Bistro / Kathi), admin: {} / {}",
                VENDOR_EMAIL, VENDOR_PASSWORD, ADMIN_EMAIL, ADMIN_PASSWORD);
    }
}
