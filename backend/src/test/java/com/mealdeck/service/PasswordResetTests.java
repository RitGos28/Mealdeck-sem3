package com.mealdeck.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.mealdeck.FixedClockConfig;
import com.mealdeck.RecordingCodeMailer;
import com.mealdeck.model.Student;
import com.mealdeck.repository.StudentRepository;
import com.mealdeck.web.StudentRequests.PasswordResetRequest;
import com.mealdeck.web.StudentRequests.SignupRequest;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;

/** Forgot password: the emailed reset code, and that it can't be swapped
 * with a sign-up code. Not @Transactional, for the same reason as
 * SignupCodeTests: a wrong guess has to stay counted after the failed
 * reset rolls back. Cleans up after itself instead. */
@SpringBootTest
@ActiveProfiles("demo")
@Import(FixedClockConfig.class)
class PasswordResetTests {

    private static final String EMAIL = "reset.test@bennett.edu.in";

    @Autowired
    SignupCodeService signupCodeService;

    @Autowired
    StudentService studentService;

    @Autowired
    StudentRepository studentRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    RecordingCodeMailer mailer;

    @Autowired
    JdbcTemplate jdbc;

    @BeforeEach
    void createAccount() {
        studentRepository.save(new Student(EMAIL, passwordEncoder.encode("oldpass1"), "Reset Test", null));
    }

    @AfterEach
    void cleanUp() {
        jdbc.update("delete from email_code");
        studentRepository.findByEmail(EMAIL).ifPresent(studentRepository::delete);
        studentRepository.findByEmail("nobody.yet@bennett.edu.in").ifPresent(studentRepository::delete);
        mailer.clear();
    }

    private static void assertRejected(ThrowingCallable call, HttpStatus status) {
        assertThatThrownBy(call).isInstanceOfSatisfying(ResponseStatusException.class,
                e -> assertThat(e.getStatusCode().value()).isEqualTo(status.value()));
    }

    private static PasswordResetRequest resetWith(String code) {
        return new PasswordResetRequest(EMAIL, code, "newpass1", "newpass1");
    }

    private boolean passwordIs(String password) {
        return passwordEncoder.matches(password, studentRepository.findByEmail(EMAIL).orElseThrow().getPasswordHash());
    }

    @Test
    void emailedCodeResetsThePasswordExactlyOnce() {
        signupCodeService.requestPasswordResetCode(EMAIL);
        String code = mailer.lastCodeFor(EMAIL);
        assertThat(code).matches("\\d{6}");

        studentService.resetPassword(resetWith(code));
        assertThat(passwordIs("newpass1")).isTrue();
        assertThat(passwordIs("oldpass1")).isFalse();

        assertRejected(() -> studentService.resetPassword(resetWith(code)), HttpStatus.BAD_REQUEST);
    }

    @Test
    void addressWithoutAnAccountGetsNoCodeButTheSameAnswer() {
        signupCodeService.requestPasswordResetCode("nobody.yet@bennett.edu.in");
        assertThat(mailer.sentTo("nobody.yet@bennett.edu.in")).isFalse();
        assertRejected(() -> signupCodeService.requestPasswordResetCode("someone@gmail.com"), HttpStatus.BAD_REQUEST);
    }

    @Test
    void wrongCodeLeavesThePasswordAloneAndCounts() {
        signupCodeService.requestPasswordResetCode(EMAIL);
        String code = mailer.lastCodeFor(EMAIL);
        String wrong = code.equals("000000") ? "111111" : "000000";

        for (int i = 0; i < SignupCodeService.MAX_WRONG_GUESSES; i++) {
            assertRejected(() -> studentService.resetPassword(resetWith(wrong)), HttpStatus.BAD_REQUEST);
        }
        // Out of guesses: even the right code no longer works.
        assertRejected(() -> studentService.resetPassword(resetWith(code)), HttpStatus.BAD_REQUEST);
        assertThat(passwordIs("oldpass1")).isTrue();
    }

    @Test
    void checksTheNewPasswordBeforeUsingUpTheCode() {
        signupCodeService.requestPasswordResetCode(EMAIL);
        String code = mailer.lastCodeFor(EMAIL);

        assertRejected(() -> studentService.resetPassword(new PasswordResetRequest(EMAIL, code, "short", "short")), HttpStatus.BAD_REQUEST);
        assertRejected(() -> studentService.resetPassword(new PasswordResetRequest(EMAIL, code, "newpass1", "newpass2")), HttpStatus.BAD_REQUEST);

        studentService.resetPassword(resetWith(code));
        assertThat(passwordIs("newpass1")).isTrue();
    }

    @Test
    void signupAndResetCodesDontWorkForEachOther() {
        String newcomer = "nobody.yet@bennett.edu.in";
        signupCodeService.requestCode(newcomer);
        String signupCode = mailer.lastCodeFor(newcomer);
        assertRejected(() -> studentService.resetPassword(new PasswordResetRequest(newcomer, signupCode, "newpass1", "newpass1")),
                HttpStatus.BAD_REQUEST);

        signupCodeService.requestPasswordResetCode(EMAIL);
        String resetCode = mailer.lastCodeFor(EMAIL);
        assertRejected(() -> studentService.signup(new SignupRequest(EMAIL, resetCode, "newpass1", "newpass1", "Reset Test", null)),
                HttpStatus.BAD_REQUEST);
        assertThat(passwordIs("oldpass1")).isTrue();
    }
}
