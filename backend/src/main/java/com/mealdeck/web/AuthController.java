package com.mealdeck.web;

import com.mealdeck.repository.VendorRepository;
import com.mealdeck.service.StudentService;
import com.mealdeck.web.AuthDtos.LoginRequest;
import com.mealdeck.web.AuthDtos.MeResponse;
import com.mealdeck.web.StudentRequests.SignupRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final VendorRepository vendorRepository;
    private final StudentService studentService;
    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();

    public AuthController(AuthenticationManager authenticationManager, VendorRepository vendorRepository, StudentService studentService) {
        this.authenticationManager = authenticationManager;
        this.vendorRepository = vendorRepository;
        this.studentService = studentService;
    }

    @PostMapping("/vendor/login")
    public MeResponse vendorLogin(@RequestBody LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        return login(request, "ROLE_VENDOR", httpRequest, httpResponse);
    }

    @PostMapping("/admin/login")
    public MeResponse adminLogin(@RequestBody LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        return login(request, "ROLE_ADMIN", httpRequest, httpResponse);
    }

    @PostMapping("/student/signup")
    public MeResponse studentSignup(@RequestBody SignupRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        studentService.signup(request);
        return login(new LoginRequest(request.email(), request.password()), "ROLE_STUDENT", httpRequest, httpResponse);
    }

    @PostMapping("/student/login")
    public MeResponse studentLogin(@RequestBody LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        return login(request, "ROLE_STUDENT", httpRequest, httpResponse);
    }

    @PostMapping("/logout")
    public void logout(HttpServletRequest request) {
        SecurityContextHolder.clearContext();
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
    }

    @GetMapping("/me")
    public MeResponse me() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return new MeResponse(null, null, null);
        }
        String role = authentication.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        Long stallId = "VENDOR".equals(role)
                ? vendorRepository.findByEmail(authentication.getName()).map(v -> v.getStall().getId()).orElse(null)
                : null;
        return new MeResponse(role, authentication.getName(), stallId);
    }

    /** Authenticates against the shared UserDetailsService, then rejects the
     * login if the account's role doesn't match this endpoint -- a vendor's
     * password must not work on the admin login form and vice versa, even
     * though both are checked by the same service. */
    private MeResponse login(LoginRequest request, String requiredRole, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        Authentication authenticated;
        try {
            authenticated = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        } catch (BadCredentialsException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        boolean hasRequiredRole = authenticated.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(requiredRole));
        if (!hasRequiredRole) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authenticated);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);

        return me();
    }
}
