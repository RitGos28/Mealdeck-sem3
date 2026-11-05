package com.mealdeck.web;

import com.mealdeck.service.MessService;
import com.mealdeck.service.MessService.MealView;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Admin side of Mess today (the whole /api/admin tree is ADMIN-only). */
@RestController
@RequestMapping("/api/admin/mess")
public class AdminMessController {

    public record Today(LocalDate date, List<MealView> meals) {
    }

    private final MessService messService;

    public AdminMessController(MessService messService) {
        this.messService = messService;
    }

    /** A day's four meals (today by default), with who added each. */
    @GetMapping
    public Today day(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate day = date != null ? date : messService.today();
        return new Today(day, messService.forDate(day));
    }

    /** Sets a meal's dishes, creating the menu if nobody added it. */
    @PutMapping("/{date}/{meal}")
    public void set(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date, @PathVariable String meal, @RequestBody MessController.MenuText body) {
        messService.adminSet(date, MessController.meal(meal), body.items());
    }

    /** Checks the menu as correct and locks it: students can no longer flag it. */
    @PostMapping("/{date}/{meal}/confirm")
    public void confirm(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date, @PathVariable String meal) {
        messService.confirm(date, MessController.meal(meal));
    }

    @PostMapping("/{date}/{meal}/unlock")
    public void unlock(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date, @PathVariable String meal) {
        messService.unlock(date, MessController.meal(meal));
    }

    @DeleteMapping("/{date}/{meal}")
    public void delete(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date, @PathVariable String meal) {
        messService.delete(date, MessController.meal(meal));
    }

    /** {"LUNCH": 70, "DINNER": null}: a null clears that price. */
    @PutMapping("/prices")
    public void prices(@RequestBody Map<String, Integer> prices) {
        prices.forEach((meal, price) -> messService.setPrice(MessController.meal(meal), price));
    }
}
