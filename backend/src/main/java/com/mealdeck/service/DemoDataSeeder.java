package com.mealdeck.service;

import com.mealdeck.model.MenuItem;
import com.mealdeck.model.Stall;
import com.mealdeck.repository.MenuItemRepository;
import com.mealdeck.repository.StallRepository;
import java.math.BigDecimal;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/** Seeds a couple of stalls once, on first boot, if the DB is empty. */
@Component
public class DemoDataSeeder implements CommandLineRunner {

    private final StallRepository stallRepository;
    private final MenuItemRepository menuItemRepository;

    public DemoDataSeeder(StallRepository stallRepository, MenuItemRepository menuItemRepository) {
        this.stallRepository = stallRepository;
        this.menuItemRepository = menuItemRepository;
    }

    @Override
    public void run(String... args) {
        if (stallRepository.count() > 0) {
            return;
        }

        Stall bistro = stallRepository.save(new Stall("Bistro / Kathi"));
        menuItemRepository.save(new MenuItem(bistro, "Paneer Kathi Roll", new BigDecimal("129"), true));
        menuItemRepository.save(new MenuItem(bistro, "Chicken Kathi Roll", new BigDecimal("149"), false));
        menuItemRepository.save(new MenuItem(bistro, "Veg Sandwich", new BigDecimal("79"), true));

        Stall snapEats = stallRepository.save(new Stall("SnapEats"));
        menuItemRepository.save(new MenuItem(snapEats, "Cold Coffee", new BigDecimal("69"), true));
        menuItemRepository.save(new MenuItem(snapEats, "Chicken Burger", new BigDecimal("139"), false));

        Stall quench = stallRepository.save(new Stall("Quench"));
        menuItemRepository.save(new MenuItem(quench, "Fresh Lime Soda", new BigDecimal("59"), true));
        menuItemRepository.save(new MenuItem(quench, "Oreo Shake", new BigDecimal("109"), true));
    }
}
