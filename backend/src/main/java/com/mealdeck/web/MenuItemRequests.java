package com.mealdeck.web;

import java.math.BigDecimal;

/** Requests for vendor/admin menu-item management. Grouped in one file,
 * same reasoning as AuthDtos. */
public class MenuItemRequests {

    /** `category` is optional: null or blank means no category. `choices`
     * (free choices like Bread or Dry/Gravy) is optional too. */
    public record CreateMenuItemRequest(String name, BigDecimal price, boolean veg, String category, java.util.List<ChoiceGroup> choices) {
        public CreateMenuItemRequest(String name, BigDecimal price, boolean veg, String category) {
            this(name, price, veg, category, null);
        }
    }

    /** Any field left null on an update is left unchanged; a blank
     * `category` clears it, and an empty `choices` list removes them. */
    public record UpdateMenuItemRequest(String name, BigDecimal price, Boolean veg, Boolean available, String category, java.util.List<ChoiceGroup> choices) {
        public UpdateMenuItemRequest(String name, BigDecimal price, Boolean veg, Boolean available, String category) {
            this(name, price, veg, available, category, null);
        }
    }

    public record UpdateStallRequest(java.time.LocalTime openTime, java.time.LocalTime closeTime, Boolean closedToday, Integer slotCapacity, Boolean ordersPaused) {
    }

    public record CreateStallRequest(String stallName, String vendorEmail, String vendorPassword, String vendorRealEmail) {
    }

    private MenuItemRequests() {
    }
}
