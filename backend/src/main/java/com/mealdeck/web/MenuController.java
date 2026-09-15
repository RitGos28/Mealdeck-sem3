package com.mealdeck.web;

import com.mealdeck.service.MenuService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MenuController {

    private final MenuService menuService;

    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    @GetMapping("/api/stalls")
    public List<StallDto> stalls() {
        return menuService.listStalls().stream().map(StallDto::from).toList();
    }

    @PostMapping("/api/menu-items/{id}/report")
    public void report(@PathVariable Long id) {
        menuService.reportOutOfStock(id);
    }
}
