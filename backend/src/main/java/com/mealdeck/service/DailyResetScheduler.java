package com.mealdeck.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Runs the daily reset at midnight server time -- simplest thing that
 * matches "everything's back in stock in the morning" without pulling in a
 * timezone dependency this app doesn't otherwise need. */
@Component
public class DailyResetScheduler {

    private static final Logger log = LoggerFactory.getLogger(DailyResetScheduler.class);

    private final MenuService menuService;

    public DailyResetScheduler(MenuService menuService) {
        this.menuService = menuService;
    }

    @Scheduled(cron = "0 0 0 * * *")
    public void resetDaily() {
        menuService.resetDailyAvailability();
        log.info("Daily reset: all menu items marked available, votes cleared");
    }
}
