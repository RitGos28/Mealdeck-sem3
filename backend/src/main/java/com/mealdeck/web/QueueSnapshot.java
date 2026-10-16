package com.mealdeck.web;

import java.time.Instant;
import java.time.LocalTime;
import java.util.List;

/** One stall's live queue, pushed to /topic/stalls/{id}/queue on every
 * change and served by GET /api/stalls/{id}/queue for the first render.
 * The topic is public, so orders carry no customer name or contact: just
 * enough for a student holding an order number to find their own place. */
public record QueueSnapshot(Long stallId, boolean ordersPaused, List<SlotDto> slots, List<QueueOrder> orders) {

    /** ahead: unfinished orders at this stall that come before this one
     * (earlier pickup slot, or same slot and placed earlier). */
    public record QueueOrder(Long id, String status, LocalTime pickupTime, Instant noShowAt, int ahead) {
    }
}
