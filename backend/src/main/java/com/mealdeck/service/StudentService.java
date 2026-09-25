package com.mealdeck.service;

import com.mealdeck.model.Student;
import com.mealdeck.repository.StudentRepository;
import com.mealdeck.web.StudentRequests.SignupRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class StudentService {

    private static final int MIN_PASSWORD_LENGTH = 6;

    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;

    public StudentService(StudentRepository studentRepository, PasswordEncoder passwordEncoder) {
        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Student signup(SignupRequest request) {
        if (!EmailDomains.isStudentEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only " + EmailDomains.STUDENT_DOMAIN + " emails are accepted");
        }
        if (request.password() == null || request.password().length() < MIN_PASSWORD_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Password must be at least " + MIN_PASSWORD_LENGTH + " characters");
        }
        if (!request.password().equals(request.confirmPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Passwords do not match");
        }
        if (request.name() == null || request.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required");
        }
        if (studentRepository.findByEmail(request.email()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with that email already exists");
        }

        Student student = new Student(request.email(), passwordEncoder.encode(request.password()), request.name(), request.phone());
        return studentRepository.save(student);
    }
}
