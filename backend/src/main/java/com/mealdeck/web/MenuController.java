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
    private final com.mealdeck.repository.VendorRepository vendorRepository;
    private final List<String> demoVendors;

    public MenuController(MenuService menuService, StudentRepository studentRepository, com.mealdeck.repository.VendorRepository vendorRepository,
            @org.springframework.beans.factory.annotation.Value("${mealdeck.demo.vendor-accounts:vendor@mealdeck.in}") List<String> demoVendors) {
        this.menuService = menuService;
        this.studentRepository = studentRepository;
        this.vendorRepository = vendorRepository;
        this.demoVendors = demoVendors.stream().map(e -> e.trim().toLowerCase()).filter(e -> !e.isEmpty()).toList();
    }

    /** Every stall students can see. A stall run by a demo vendor login
     * (vendor@mealdeck.in, public for Play reviewers) is never listed: it's
     * a pretend stall, not a place to order. */
    @GetMapping("/api/stalls")
    public List<StallDto> stalls() {
        java.util.Set<Long> demoStalls = vendorRepository.findAll().stream()
                .filter(vendor -> demoVendors.contains(vendor.getEmail().toLowerCase()) && vendor.getStall() != null)
                .map(vendor -> vendor.getStall().getId())
                .collect(java.util.stream.Collectors.toSet());
        return menuService.listStalls().stream().filter(stall -> !demoStalls.contains(stall.getId())).map(StallDto::from).toList();
    }

    @PostMapping("/api/menu-items/{id}/report")
    public void report(@PathVariable Long id, Authentication authentication) {
        Student student = studentRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        menuService.reportOutOfStock(id, student.getId());
    }
}
