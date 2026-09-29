package com.mealdeck.model;

public enum OrderStatus {
    PLACED,
    ACCEPTED,
    READY,
    COMPLETED,
    NO_SHOW,
    CANCELLED;

    /** Vendors advance orders forward one step at a time, or cancel from any
     * non-terminal state. A ready order ends as either picked up (COMPLETED)
     * or NO_SHOW -- and a NO_SHOW can still become COMPLETED, since the
     * auto no-show timer can fire just before a late student arrives. */
    public boolean canTransitionTo(OrderStatus next) {
        if (next == CANCELLED) {
            return !isFinal();
        }
        return switch (this) {
            case PLACED -> next == ACCEPTED;
            case ACCEPTED -> next == READY;
            case READY -> next == COMPLETED || next == NO_SHOW;
            case NO_SHOW -> next == COMPLETED;
            case COMPLETED, CANCELLED -> false;
        };
    }

    public boolean isFinal() {
        return this == COMPLETED || this == NO_SHOW || this == CANCELLED;
    }
}
