package com.mealdeck.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Once a minute, marks orders that have sat READY for longer than
 * OrderService.NO_SHOW_AFTER as NO_SHOW, so an uncollected order doesn't
 * sit on the vendor's list forever. */
@Component
public class NoShowScheduler {

    private static final Logger log = LoggerFactory.getLogger(NoShowScheduler.class);

    private final OrderService orderService;

    public NoShowScheduler(OrderService orderService) {
        this.orderService = orderService;
    }

    @Scheduled(fixedDelay = 60_000)
    public void expireUncollected() {
        int expired = orderService.expireUncollected();
        if (expired > 0) {
            log.info("Marked {} uncollected order(s) as no-show", expired);
        }
    }
}
