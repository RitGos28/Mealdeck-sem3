package com.mealdeck.service;

/** Something changed one stall's live queue: an order was placed or moved
 * status, or the vendor changed capacity or closed for the day. Published
 * inside the transaction; QueueBroadcaster sends the new snapshot only once
 * it commits, so watchers never see a change that later rolls back. */
public record QueueChangedEvent(Long stallId) {
}
