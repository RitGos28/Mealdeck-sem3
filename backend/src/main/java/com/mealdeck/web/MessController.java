package com.mealdeck.web;

import com.mealdeck.model.MessMeal.Meal;
import com.mealdeck.repository.StudentRepository;
import com.mealdeck.service.MessService;
import com.mealdeck.service.MessService.MealView;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** "Mess today": anyone can read it; adding a menu or saying one isn't
 * correct needs a student login (SecurityConfig). */
@RestController
@RequestMapping("/api/mess")
public class MessController {

    public record Today(LocalDate date, List<MealView> meals) {
    }

    public record MenuText(String items) {
    }

    public record Correction(String correction) {
    }

    private final MessService messService;
    private final StudentRepository studentRepository;

    public MessController(MessService messService, StudentRepository studentRepository) {
        this.messService = messService;
        this.studentRepository = studentRepository;
    }

    @GetMapping("/today")
    public Today today(Authentication authentication) {
        Long studentId = isStudent(authentication)
                ? studentRepository.findByEmail(authentication.getName()).map(s -> s.getId()).orElse(null)
                : null;
        return new Today(messService.today(), messService.today(studentId, false));
    }

    @PostMapping("/today/{meal}")
    public void add(Authentication authentication, @PathVariable String meal, @RequestBody MenuText body) {
        messService.add(studentId(authentication), meal(meal), body.items());
    }

    @PostMapping("/today/{meal}/flags")
    public void flag(Authentication authentication, @PathVariable String meal, @RequestBody Correction body) {
        messService.flag(studentId(authentication), meal(meal), body.correction());
    }

    static Meal meal(String value) {
        try {
            return Meal.valueOf(value.toUpperCase(java.util.Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No such meal: " + value);
        }
    }

    private static boolean isStudent(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"));
    }

    private Long studentId(Authentication authentication) {
        return studentRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED)).getId();
    }
}
