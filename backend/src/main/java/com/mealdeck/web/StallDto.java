package com.mealdeck.web;

import com.mealdeck.model.Stall;
import java.time.LocalTime;
import java.util.List;

public record StallDto(
        Long id,
        String name,
        boolean open,
        LocalTime openTime,
        LocalTime closeTime,
        boolean closedToday,
        List<MenuItemDto> items) {

    public static StallDto from(Stall stall) {
        return new StallDto(
                stall.getId(),
                stall.getName(),
                stall.isOpenAt(LocalTime.now()),
                stall.getOpenTime(),
                stall.getCloseTime(),
                stall.isClosedToday(),
                stall.getMenuItems().stream().map(MenuItemDto::from).toList());
    }
}
