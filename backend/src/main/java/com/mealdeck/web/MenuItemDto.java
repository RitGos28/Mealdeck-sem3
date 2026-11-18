package com.mealdeck.web;

import com.mealdeck.model.MenuItem;
import java.math.BigDecimal;

/**
 * Never serialize JPA entities directly: Stall -> menuItems -> stall -> ...
 * is a circular reference Jackson can't handle, and it leaks persistence
 * fields the frontend has no business seeing. A DTO record is the fix.
 */
public record MenuItemDto(Long id, String name, BigDecimal price, boolean veg, boolean available, int reportCount, String image, String category, java.util.List<ChoiceGroup> choices) {

    public static MenuItemDto from(MenuItem item) {
        return new MenuItemDto(item.getId(), item.getName(), item.getPrice(), item.isVeg(), item.isAvailable(), item.getReportCount(), item.getImage(), item.getCategory(), com.mealdeck.service.MenuChoices.parse(item.getChoices()));
    }
}
