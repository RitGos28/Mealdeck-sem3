package com.mealdeck.model;

import static com.mealdeck.model.OrderStatus.ACCEPTED;
import static com.mealdeck.model.OrderStatus.CANCELLED;
import static com.mealdeck.model.OrderStatus.COMPLETED;
import static com.mealdeck.model.OrderStatus.NO_SHOW;
import static com.mealdeck.model.OrderStatus.PLACED;
import static com.mealdeck.model.OrderStatus.READY;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;

/** The whole transition table, checked pair by pair, so a new status or a
 * loosened rule can't slip in unnoticed. No Spring context needed. */
class OrderStatusTests {

    private static final Map<OrderStatus, Set<OrderStatus>> ALLOWED = Map.of(
            PLACED, EnumSet.of(ACCEPTED, CANCELLED),
            ACCEPTED, EnumSet.of(READY, CANCELLED),
            READY, EnumSet.of(COMPLETED, NO_SHOW, CANCELLED),
            // A late student can still collect after the no-show timer fired.
            NO_SHOW, EnumSet.of(COMPLETED),
            COMPLETED, EnumSet.noneOf(OrderStatus.class),
            CANCELLED, EnumSet.noneOf(OrderStatus.class));

    @Test
    void everyTransitionMatchesTheTable() {
        assertThat(ALLOWED.keySet()).containsExactlyInAnyOrder(OrderStatus.values());
        for (OrderStatus from : OrderStatus.values()) {
            for (OrderStatus to : OrderStatus.values()) {
                assertThat(from.canTransitionTo(to))
                        .as("%s -> %s", from, to)
                        .isEqualTo(ALLOWED.get(from).contains(to));
            }
        }
    }

    @Test
    void onlyCollectedNoShowAndCancelledAreFinal() {
        assertThat(EnumSet.allOf(OrderStatus.class)).filteredOn(OrderStatus::isFinal)
                .containsExactlyInAnyOrder(COMPLETED, NO_SHOW, CANCELLED);
    }
}
