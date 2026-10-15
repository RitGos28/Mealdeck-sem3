package com.mealdeck.service;

import com.mealdeck.model.Student;
import com.mealdeck.repository.StudentRepository;
import com.mealdeck.repository.ReportRepository;
import com.mealdeck.web.StudentRequests.SignupRequest;
import com.mealdeck.web.AdminUserRequests.CreateStudentRequest;
import com.mealdeck.web.AdminUserRequests.UpdateStudentRequest;
import java.util.List;
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
    private final ReportRepository reportRepository;

    public StudentService(StudentRepository studentRepository, PasswordEncoder passwordEncoder, ReportRepository reportRepository) {
        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
        this.reportRepository = reportRepository;
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

    public List<Student> list() { return studentRepository.findAll(); }

    @Transactional
    public Student createByAdmin(CreateStudentRequest request) {
        validateEmail(request.email(), null);
        validatePassword(request.password());
        requireName(request.name());
        return studentRepository.save(new Student(request.email().trim().toLowerCase(), passwordEncoder.encode(request.password()), request.name().trim(), blankToNull(request.phone())));
    }

    @Transactional
    public Student updateByAdmin(Long id, UpdateStudentRequest request) {
        Student student = get(id);
        if (request.email() != null) { validateEmail(request.email(), id); student.setEmail(request.email().trim().toLowerCase()); }
        if (request.password() != null && !request.password().isBlank()) { validatePassword(request.password()); student.setPasswordHash(passwordEncoder.encode(request.password())); }
        if (request.name() != null) { requireName(request.name()); student.setName(request.name().trim()); }
        if (request.phone() != null) student.setPhone(blankToNull(request.phone()));
        return studentRepository.save(student);
    }

    @Transactional
    public void deleteByAdmin(Long id) {
        Student student = get(id);
        reportRepository.deleteByStudentId(id);
        studentRepository.delete(student);
    }

    private Student get(Long id) {
        return studentRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No student " + id));
    }

    private void validateEmail(String email, Long currentId) {
        if (!EmailDomains.isStudentEmail(email)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only " + EmailDomains.STUDENT_DOMAIN + " emails are accepted");
        studentRepository.findByEmail(email.trim().toLowerCase()).filter(student -> !student.getId().equals(currentId))
                .ifPresent(student -> { throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with that email already exists"); });
    }

    private void validatePassword(String password) {
        if (password == null || password.length() < MIN_PASSWORD_LENGTH) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least " + MIN_PASSWORD_LENGTH + " characters");
    }

    private void requireName(String name) {
        if (name == null || name.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name is required");
    }

    private static String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
