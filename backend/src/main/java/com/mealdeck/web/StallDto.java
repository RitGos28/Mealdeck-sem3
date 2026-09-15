package com.mealdeck.web;

import com.mealdeck.model.Stall;
import java.util.List;

public record StallDto(Long id, String name, List<MenuItemDto> items) {

    public static StallDto from(Stall stall) {
        return new StallDto(
                stall.getId(),
                stall.getName(),
                stall.getMenuItems().stream().map(MenuItemDto::from).toList());
    }
}
