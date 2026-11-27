package com.mealdeck.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.time.Instant;

/** A dish went out of stock: three students reported it, or the stall
 * unticked it. Kept (unlike the reports themselves, which reset at midnight)
 * so MealDeck can learn when each dish usually sells out. Anonymous: it
 * records the dish and the time, never who reported it. */
@Entity
public class SoldOutEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    @Column(nullable = false)
    private Instant occurredAt;

    /** True when the stall marked it, false when students' reports did. */
    @Column(nullable = false)
    private boolean byStall;

    protected SoldOutEvent() {
    }

    public SoldOutEvent(MenuItem menuItem, Instant occurredAt, boolean byStall) {
        this.menuItem = menuItem;
        this.occurredAt = occurredAt;
        this.byStall = byStall;
    }

    public MenuItem getMenuItem() {
        return menuItem;
    }

    public Instant getOccurredAt() {
        return occurredAt;
    }

    public boolean isByStall() {
        return byStall;
    }
}
