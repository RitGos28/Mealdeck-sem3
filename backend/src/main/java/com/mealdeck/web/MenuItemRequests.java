package com.mealdeck.web;

import java.math.BigDecimal;

/** Requests for vendor/admin menu-item management. Grouped in one file,
 * same reasoning as AuthDtos. */
public class MenuItemRequests {

    public record CreateMenuItemRequest(String name, BigDecimal price, boolean veg) {
    }

    /** Any field left null on an update is left unchanged. */
    public record UpdateMenuItemRequest(String name, BigDecimal price, Boolean veg, Boolean available) {
    }

    public record UpdateStallRequest(java.time.LocalTime openTime, java.time.LocalTime closeTime, Boolean closedToday) {
    }

    public record CreateStallRequest(String stallName, String vendorEmail, String vendorPassword) {
    }

    private MenuItemRequests() {
    }
}
