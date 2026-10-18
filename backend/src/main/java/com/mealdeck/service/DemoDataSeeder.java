package com.mealdeck.service;

import com.mealdeck.model.MenuItem;
import com.mealdeck.model.Stall;
import com.mealdeck.repository.MenuItemRepository;
import com.mealdeck.repository.StallRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

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

        menuItemRepository.saveAll(List.of(
                new MenuItem(bistro, "Paneer Kathi Roll", new BigDecimal("129"), true),
                new MenuItem(bistro, "Chicken Kathi Roll", new BigDecimal("149"), false),
                new MenuItem(bistro, "Veg Sandwich", new BigDecimal("79"), true),
                new MenuItem(snapEats, "Cold Coffee", new BigDecimal("69"), true),
                new MenuItem(snapEats, "Chicken Burger", new BigDecimal("139"), false),
                new MenuItem(quench, "Fresh Lime Soda", new BigDecimal("59"), true),
                new MenuItem(quench, "Oreo Shake", new BigDecimal("109"), true)));
    }
}
