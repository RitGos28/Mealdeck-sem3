package com.mealdeck.web;

import com.mealdeck.model.Student;
import com.mealdeck.repository.StudentRepository;
import com.mealdeck.service.AccountDeletionService;
import com.mealdeck.service.AccountDeletionService.Status;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** The logged-in student deleting (or un-deleting) their own account. */
@RestController
@RequestMapping("/api/account/deletion")
public class AccountController {

    public record DeletionRequest(String password) {
    }

    private final AccountDeletionService accountDeletion;
    private final StudentRepository studentRepository;

    public AccountController(AccountDeletionService accountDeletion, StudentRepository studentRepository) {
        this.accountDeletion = accountDeletion;
        this.studentRepository = studentRepository;
    }

    @GetMapping
    public Status status(Authentication authentication) {
        return accountDeletion.status(student(authentication));
    }

    @PostMapping
    public Status request(Authentication authentication, @RequestBody DeletionRequest request) {
        return accountDeletion.request(student(authentication).getId(), request.password());
    }

    @DeleteMapping
    public Status cancel(Authentication authentication) {
        return accountDeletion.cancel(student(authentication).getId());
    }

    private Student student(Authentication authentication) {
        return studentRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Log in as a student"));
    }
}
