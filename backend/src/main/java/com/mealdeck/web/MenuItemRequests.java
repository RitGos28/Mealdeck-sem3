package com.mealdeck.web;

import java.math.BigDecimal;

/** Requests for vendor/admin menu-item management. Grouped in one file,
 * same reasoning as AuthDtos. */
public class MenuItemRequests {

    /** `category` is optional: null or blank means no category. */
    public record CreateMenuItemRequest(String name, BigDecimal price, boolean veg, String category) {
    }

    /** Any field left null on an update is left unchanged; a blank
     * `category` clears it. */
    public record UpdateMenuItemRequest(String name, BigDecimal price, Boolean veg, Boolean available, String category) {
    }

    public record UpdateStallRequest(java.time.LocalTime openTime, java.time.LocalTime closeTime, Boolean closedToday, Integer slotCapacity, Boolean ordersPaused) {
    }

    public record CreateStallRequest(String stallName, String vendorEmail, String vendorPassword, String vendorRealEmail) {
    }

    private MenuItemRequests() {
    }
}
