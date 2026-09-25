package com.mealdeck.web;

import com.mealdeck.model.Student;
import com.mealdeck.repository.StudentRepository;
import com.mealdeck.service.MenuService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class MenuController {

    private final MenuService menuService;
    private final StudentRepository studentRepository;

    public MenuController(MenuService menuService, StudentRepository studentRepository) {
        this.menuService = menuService;
        this.studentRepository = studentRepository;
    }

    @GetMapping("/api/stalls")
    public List<StallDto> stalls() {
        return menuService.listStalls().stream().map(StallDto::from).toList();
    }

    @PostMapping("/api/menu-items/{id}/report")
    public void report(@PathVariable Long id, Authentication authentication) {
        Student student = studentRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        menuService.reportOutOfStock(id, student.getId());
    }
}
