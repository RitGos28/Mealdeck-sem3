package com.mealdeck.web;

import com.mealdeck.repository.StudentRepository;
import com.mealdeck.service.PreorderRequestService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** "I'd pre-order here" for the logged-in student (SecurityConfig: STUDENT only). */
@RestController
@RequestMapping("/api/preorder-requests")
public class PreorderRequestController {

    private final PreorderRequestService service;
    private final StudentRepository studentRepository;

    public PreorderRequestController(PreorderRequestService service, StudentRepository studentRepository) {
        this.service = service;
        this.studentRepository = studentRepository;
    }

    /** The stall ids this student has asked for. */
    @GetMapping
    public List<Long> mine(Authentication authentication) {
        return service.mine(studentId(authentication));
    }

    @PutMapping("/{stallId}")
    public void request(Authentication authentication, @PathVariable Long stallId) {
        service.request(studentId(authentication), stallId);
    }

    @DeleteMapping("/{stallId}")
    public void withdraw(Authentication authentication, @PathVariable Long stallId) {
        service.withdraw(studentId(authentication), stallId);
    }

    private Long studentId(Authentication authentication) {
        return studentRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED)).getId();
    }
}
