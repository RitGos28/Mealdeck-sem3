package com.mealdeck.web;

import com.mealdeck.repository.StudentRepository;
import com.mealdeck.service.SurveyService;
import com.mealdeck.service.SurveyService.Request;
import com.mealdeck.service.SurveyService.Summary;
import com.mealdeck.service.SurveyService.View;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** The Account questionnaire. /api/account/** is STUDENT-only and
 * /api/admin/** ADMIN-only (SecurityConfig), so nothing extra is needed here. */
@RestController
@RequestMapping("/api")
public class SurveyController {

    /** answers is null until the student has answered; options are what the form offers. */
    public record Form(View answers, Map<String, String> sources, Map<String, String> features) {
    }

    private final SurveyService service;
    private final StudentRepository studentRepository;

    public SurveyController(SurveyService service, StudentRepository studentRepository) {
        this.service = service;
        this.studentRepository = studentRepository;
    }

    @GetMapping("/account/survey")
    public Form form(Authentication authentication) {
        return new Form(service.mine(studentId(authentication)), SurveyService.SOURCES, SurveyService.FEATURES);
    }

    @PutMapping("/account/survey")
    public View save(Authentication authentication, @RequestBody Request request) {
        return service.save(studentId(authentication), request);
    }

    @GetMapping("/admin/survey")
    public Summary summary() {
        return service.summary();
    }

    private Long studentId(Authentication authentication) {
        return studentRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED)).getId();
    }
}
