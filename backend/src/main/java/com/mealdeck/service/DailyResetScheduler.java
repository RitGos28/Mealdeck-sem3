package com.mealdeck.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Runs the daily reset at campus midnight. Pinned to IST rather than the
 * server's own zone: inside a container that's UTC, which would run the
 * reset at 5:30 AM IST, after early stalls have opened. */
@Component
public class DailyResetScheduler {

    private static final Logger log = LoggerFactory.getLogger(DailyResetScheduler.class);

    private final MenuService menuService;

    public DailyResetScheduler(MenuService menuService) {
        this.menuService = menuService;
    }

    @Scheduled(cron = "0 0 0 * * *", zone = "Asia/Kolkata")
    public void resetDaily() {
        menuService.resetDailyAvailability();
        log.info("Daily reset: all menu items marked available, votes cleared");
    }
}
