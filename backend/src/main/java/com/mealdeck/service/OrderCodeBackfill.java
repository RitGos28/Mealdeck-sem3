package com.mealdeck.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/** At startup, gives a public code to any order placed before codes existed,
 * so every order can be reached by its link. A no-op once they all have one. */
@Component
public class OrderCodeBackfill {

    private static final Logger log = LoggerFactory.getLogger(OrderCodeBackfill.class);

    private final OrderService orderService;

    public OrderCodeBackfill(OrderService orderService) {
        this.orderService = orderService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void fillMissingCodes() {
        int filled = orderService.fillMissingCodes();
        if (filled > 0) {
            log.info("Gave {} older order(s) a public code", filled);
        }
    }
}
