package com.mealdeck.web;

import com.mealdeck.model.Student;
import com.mealdeck.repository.StudentRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Demo only: logs a visitor in as a fresh, temporary student so every
 * feature works without signing up. The account has no usable password, and
 * the demo's in-memory database is wiped on every restart. Refuses (404)
 * anywhere but a simulated-history demo run, so it can never create
 * accounts on mealdeck.in. */
@RestController
public class DemoGuestController {

    private final boolean enabled;
    private final StudentRepository studentRepository;
    private final UserDetailsService userDetailsService;
    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();
    private final AuthController authController;

    public DemoGuestController(Environment environment, @Value("${mealdeck.demo.history:false}") boolean history,
            @Value("${spring.datasource.url:}") String datasourceUrl, StudentRepository studentRepository,
            UserDetailsService userDetailsService, AuthController authController) {
        this.enabled = history && environment.acceptsProfiles(Profiles.of("demo")) && datasourceUrl.startsWith("jdbc:h2:mem:");
        this.studentRepository = studentRepository;
        this.userDetailsService = userDetailsService;
        this.authController = authController;
    }

    @PostMapping("/api/demo/guest")
    public AuthDtos.MeResponse guest(HttpServletRequest request, HttpServletResponse response) {
        if (!enabled) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        String id = UUID.randomUUID().toString().substring(0, 8);
        Student student = studentRepository.save(new Student("guest-" + id + "@demo.mealdeck.in", "!guest", "Guest " + id.substring(0, 4), null));
        UserDetails user = userDetailsService.loadUserByUsername(student.getEmail());
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(user, null, user.getAuthorities()));
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);
        return authController.me();
    }
}
