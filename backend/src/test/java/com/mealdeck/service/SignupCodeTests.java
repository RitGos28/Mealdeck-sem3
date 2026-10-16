package com.mealdeck.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.mealdeck.FixedClockConfig;
import com.mealdeck.RecordingCodeMailer;
import com.mealdeck.repository.StudentRepository;
import com.mealdeck.web.StudentRequests.SignupRequest;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;

/** The emailed sign-up code: limits, expiry and one-time use. Not
 * @Transactional on purpose: a wrong guess has to stay counted after the
 * failed signup rolls everything else back, which only shows up when
 * transactions really commit. Cleans up after itself instead. */
@SpringBootTest
@ActiveProfiles("demo")
@Import(FixedClockConfig.class)
class SignupCodeTests {

    private static final String EMAIL = "signup.test@bennett.edu.in";

    @Autowired
    SignupCodeService signupCodeService;

    @Autowired
    StudentService studentService;

    @Autowired
    StudentRepository studentRepository;

    @Autowired
    RecordingCodeMailer mailer;

    @Autowired
    JdbcTemplate jdbc;

    @AfterEach
    void cleanUp() {
        jdbc.update("delete from email_code");
        studentRepository.findByEmail(EMAIL).ifPresent(studentRepository::delete);
        mailer.clear();
    }

    private static void assertRejected(ThrowingCallable call, HttpStatus status) {
        assertThatThrownBy(call).isInstanceOfSatisfying(ResponseStatusException.class,
                e -> assertThat(e.getStatusCode().value()).isEqualTo(status.value()));
    }

    private SignupRequest signupWith(String code) {
        return new SignupRequest(EMAIL, code, "secret1", "secret1", "Signup Test", null);
    }

    /** Moves the last send back in time instead of moving the pinned clock. */
    private void lastSentAgo(Duration age) {
        jdbc.update("update email_code set last_sent_at = ?", Timestamp.from(FixedClockConfig.NOW.minus(age)));
    }

    @Test
    void emailedCodeCreatesTheAccountExactlyOnce() {
        signupCodeService.requestCode(EMAIL);
        String code = mailer.lastCodeFor(EMAIL);
        assertThat(code).matches("\\d{6}");

        assertThat(studentService.signup(signupWith(code)).getEmail()).isEqualTo(EMAIL);
        // Used up: the same code can't start a second signup.
        assertRejected(() -> studentService.signup(signupWith(code)), HttpStatus.BAD_REQUEST);
    }

    @Test
    void addressIsTrimmedAndLowerCasedThroughout() {
        signupCodeService.requestCode("  Signup.Test@Bennett.EDU.in ");
        String code = mailer.lastCodeFor(EMAIL);

        var student = studentService.signup(new SignupRequest(" SIGNUP.test@bennett.edu.in", code, "secret1", "secret1", "Signup Test", null));

        assertThat(student.getEmail()).isEqualTo(EMAIL);
    }

    @Test
    void signupWithoutAskingForACodeFails() {
        assertRejected(() -> studentService.signup(signupWith("123456")), HttpStatus.BAD_REQUEST);
    }

    @Test
    void wrongGuessesStayCountedAndFiveLockTheCode() {
        signupCodeService.requestCode(EMAIL);
        String code = mailer.lastCodeFor(EMAIL);
        String wrong = code.equals("000000") ? "111111" : "000000";

        for (int guess = 0; guess < SignupCodeService.MAX_WRONG_GUESSES; guess++) {
            assertRejected(() -> studentService.signup(signupWith(wrong)), HttpStatus.BAD_REQUEST);
        }
        assertThat(jdbc.queryForObject("select attempts from email_code", Integer.class)).isEqualTo(5);

        // Even the right code no longer works; a new one has to be sent.
        assertRejected(() -> studentService.signup(signupWith(code)), HttpStatus.BAD_REQUEST);
        assertThat(studentRepository.findByEmail(EMAIL)).isEmpty();
    }

    @Test
    void codeExpiresAfterFiveMinutes() {
        signupCodeService.requestCode(EMAIL);
        String code = mailer.lastCodeFor(EMAIL);
        assertThat(SignupCodeService.CODE_TTL).isEqualTo(Duration.ofMinutes(5));

        jdbc.update("update email_code set expires_at = ?", Timestamp.from(FixedClockConfig.NOW.minusSeconds(1)));

        assertRejected(() -> studentService.signup(signupWith(code)), HttpStatus.BAD_REQUEST);
    }

    @Test
    void aNewCodeReplacesTheOldOne() {
        signupCodeService.requestCode(EMAIL);
        String first = mailer.lastCodeFor(EMAIL);
        lastSentAgo(Duration.ofMinutes(2));
        signupCodeService.requestCode(EMAIL);
        String second = mailer.lastCodeFor(EMAIL);

        if (!first.equals(second)) {
            assertRejected(() -> studentService.signup(signupWith(first)), HttpStatus.BAD_REQUEST);
        }
        assertThat(studentService.signup(signupWith(second)).getId()).isNotNull();
    }

    @Test
    void oneCodePerMinute() {
        signupCodeService.requestCode(EMAIL);
        assertRejected(() -> signupCodeService.requestCode(EMAIL), HttpStatus.TOO_MANY_REQUESTS);

        lastSentAgo(Duration.ofSeconds(61));
        signupCodeService.requestCode(EMAIL);
    }

    @Test
    void atMostFiveCodesADay() {
        for (int send = 0; send < SignupCodeService.MAX_SENDS_PER_DAY; send++) {
            signupCodeService.requestCode(EMAIL);
            lastSentAgo(Duration.ofMinutes(2));
        }
        assertRejected(() -> signupCodeService.requestCode(EMAIL), HttpStatus.TOO_MANY_REQUESTS);
    }

    @Test
    void aFailedSendDoesntCountAgainstTheLimits() {
        mailer.failNextSend();
        assertRejected(() -> signupCodeService.requestCode(EMAIL), HttpStatus.BAD_GATEWAY);

        // No cooldown started, so asking again straight away works.
        signupCodeService.requestCode(EMAIL);
        assertThat(mailer.sentTo(EMAIL)).isTrue();
    }

    @Test
    void existingAccountsGetTheSameAnswerButNoEmail() {
        // Seeded by DemoDataSeeder: no error, nothing sent.
        signupCodeService.requestCode("student@bennett.edu.in");
        assertThat(mailer.sentTo("student@bennett.edu.in")).isFalse();
        // ...and it's rate-limited just like a new address.
        assertRejected(() -> signupCodeService.requestCode("student@bennett.edu.in"), HttpStatus.TOO_MANY_REQUESTS);
    }
}
