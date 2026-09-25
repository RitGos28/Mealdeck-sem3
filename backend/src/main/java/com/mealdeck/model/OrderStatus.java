package com.mealdeck.model;

public enum OrderStatus {
    PLACED,
    ACCEPTED,
    READY,
    COMPLETED,
    CANCELLED;

    /** Vendors advance orders forward one step at a time, or cancel from any
     * non-terminal state. Keeps the status history meaningful. */
    public boolean canTransitionTo(OrderStatus next) {
        if (next == CANCELLED) {
            return this != COMPLETED && this != CANCELLED;
        }
        return switch (this) {
            case PLACED -> next == ACCEPTED;
            case ACCEPTED -> next == READY;
            case READY -> next == COMPLETED;
            case COMPLETED, CANCELLED -> false;
        };
    }
}
