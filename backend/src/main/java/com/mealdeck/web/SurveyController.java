package com.mealdeck.web;

import com.mealdeck.repository.StudentRepository;
import com.mealdeck.service.SurveyService;
import com.mealdeck.service.SurveyService.Mine;
import com.mealdeck.service.SurveyService.Question;
import com.mealdeck.service.SurveyService.Summary;
import java.util.List;
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

    /** mine is null until the student has answered; questions are what the form shows. */
    public record Form(Mine mine, List<Question> questions) {
    }

    private final SurveyService service;
    private final StudentRepository studentRepository;

    public SurveyController(SurveyService service, StudentRepository studentRepository) {
        this.service = service;
        this.studentRepository = studentRepository;
    }

    @GetMapping("/account/survey")
    public Form form(Authentication authentication) {
        return new Form(service.mine(studentId(authentication)), SurveyService.QUESTIONS);
    }

    /** The body maps question ids to a choice key, a list of keys, or text. */
    @PutMapping("/account/survey")
    public Mine save(Authentication authentication, @RequestBody Map<String, Object> answers) {
        return service.save(studentId(authentication), answers);
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
