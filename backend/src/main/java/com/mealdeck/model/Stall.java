package com.mealdeck.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Stall {

    public static final int DEFAULT_SLOT_CAPACITY = 15;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @OneToMany(mappedBy = "stall")
    private List<MenuItem> menuItems = new ArrayList<>();

    private LocalTime openTime;

    private LocalTime closeTime;

    @Column(nullable = false)
    private boolean closedToday = false;

    /** Most orders the stall takes for one pickup slot. Nullable, not an
     * int column: ddl-auto=update would backfill existing rows with 0 and
     * make every slot full; null reads as DEFAULT_SLOT_CAPACITY instead. */
    private Integer slotCapacity;

    /** Vendor's "pause orders" switch: the stall stays open and keeps
     * working through orders it has, but takes no new ones. Nullable for
     * the same ddl-auto=update reason as slotCapacity; null means not
     * paused. Cleared at midnight; closedToday is not, it stays until
     * turned off by hand. */
    private Boolean ordersPaused;

    protected Stall() {
    }

    public Stall(String name) {
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public List<MenuItem> getMenuItems() {
        return menuItems;
    }

    public LocalTime getOpenTime() {
        return openTime;
    }

    public void setOpenTime(LocalTime openTime) {
        this.openTime = openTime;
    }

    public LocalTime getCloseTime() {
        return closeTime;
    }

    public void setCloseTime(LocalTime closeTime) {
        this.closeTime = closeTime;
    }

    public boolean isClosedToday() {
        return closedToday;
    }

    public void setClosedToday(boolean closedToday) {
        this.closedToday = closedToday;
    }

    public int getSlotCapacity() {
        return slotCapacity != null ? slotCapacity : DEFAULT_SLOT_CAPACITY;
    }

    public void setSlotCapacity(Integer slotCapacity) {
        this.slotCapacity = slotCapacity;
    }

    public boolean isOrdersPaused() {
        return Boolean.TRUE.equals(ordersPaused);
    }

    public void setOrdersPaused(boolean ordersPaused) {
        this.ordersPaused = ordersPaused;
    }

    /** No hours set means "always open" (today's early stalls don't set any). */
    public boolean isOpenAt(LocalTime now) {
        if (closedToday) {
            return false;
        }
        if (openTime == null || closeTime == null) {
            return true;
        }
        return !now.isBefore(openTime) && !now.isAfter(closeTime);
    }
}
