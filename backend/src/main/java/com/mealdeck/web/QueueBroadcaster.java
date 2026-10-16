package com.mealdeck.web;

import com.mealdeck.service.QueueChangedEvent;
import com.mealdeck.service.QueueService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/** Pushes a stall's fresh queue to /topic/stalls/{id}/queue once the change
 * behind it has committed. */
@Component
public class QueueBroadcaster {

    private static final Logger log = LoggerFactory.getLogger(QueueBroadcaster.class);

    private final QueueService queueService;
    private final SimpMessagingTemplate messaging;

    public QueueBroadcaster(QueueService queueService, SimpMessagingTemplate messaging) {
        this.queueService = queueService;
        this.messaging = messaging;
    }

    public static String topic(Long stallId) {
        return "/topic/stalls/" + stallId + "/queue";
    }

    /** REQUIRES_NEW: the committed transaction's persistence context is
     * still bound here, and a fresh one reads exactly what was committed.
     * A failed push is only logged; the order itself already went through,
     * and pages refetch when they reconnect. */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    public void onQueueChanged(QueueChangedEvent event) {
        try {
            messaging.convertAndSend(topic(event.stallId()), queueService.snapshot(event.stallId()));
        } catch (RuntimeException e) {
            log.warn("Couldn't push queue update for stall {}", event.stallId(), e);
        }
    }
}
