package com.mealdeck.web;

import com.mealdeck.model.Student;
import com.mealdeck.repository.StudentRepository;
import com.mealdeck.service.StudentService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** The logged-in student's "I only eat veg" setting. It changes what's shown
 * first; it never stops anyone ordering (a veg student can still order for a
 * friend, with a heads-up in the bag). */
@RestController
@RequestMapping("/api/account/diet")
public class DietController {

    public record DietRequest(boolean vegOnly) {
    }

    public record DietResponse(boolean vegOnly) {
    }

    private final StudentService studentService;
    private final StudentRepository studentRepository;

    public DietController(StudentService studentService, StudentRepository studentRepository) {
        this.studentService = studentService;
        this.studentRepository = studentRepository;
    }

    @PutMapping
    public DietResponse set(Authentication authentication, @RequestBody DietRequest request) {
        Student student = studentRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Log in as a student"));
        return new DietResponse(studentService.setVegOnly(student.getId(), request.vegOnly()));
    }
}
