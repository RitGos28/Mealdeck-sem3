package com.mealdeck.service;

import com.mealdeck.model.EmailCode;
import com.mealdeck.model.EmailCode.Purpose;
import com.mealdeck.repository.EmailCodeRepository;
import com.mealdeck.repository.StudentRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HexFormat;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Proves a student owns a Bennett inbox: a 6-digit code, emailed, then
 * required by StudentService.signup or StudentService.resetPassword. Same
 * limits as mealdeck_improved's OTP: hashed at rest, 5-minute expiry, 5
 * wrong guesses, a minute between sends and a daily cap per address,
 * shared by both kinds of code. */
@Service
public class SignupCodeService {

    public static final Duration CODE_TTL = Duration.ofMinutes(5);
    static final Duration RESEND_COOLDOWN = Duration.ofSeconds(60);
    static final int MAX_SENDS_PER_DAY = 5;
    static final int MAX_WRONG_GUESSES = 5;

    private static final Logger log = LoggerFactory.getLogger(SignupCodeService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final EmailCodeRepository emailCodeRepository;
    private final StudentRepository studentRepository;
    private final CodeMailer mailer;
    private final Clock clock;
    private final com.mealdeck.repository.AdminRepository adminRepository;

    public SignupCodeService(EmailCodeRepository emailCodeRepository, StudentRepository studentRepository, CodeMailer mailer, Clock clock, com.mealdeck.repository.AdminRepository adminRepository) {
        this.emailCodeRepository = emailCodeRepository;
        this.studentRepository = studentRepository;
        this.mailer = mailer;
        this.clock = clock;
        this.adminRepository = adminRepository;
    }

    public static String normalize(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    /** Emails a sign-up code unless the address already has an account. The
     * caller gets the same answer either way, so the form can't be used to
     * find out who has signed up. A failed send rolls back, so it doesn't
     * count against the limits. */
    @Transactional
    public void requestCode(String rawEmail) {
        requestCode(rawEmail, Purpose.SIGNUP);
    }

    /** The mirror image: emails a reset code only if the address has an
     * account, with the same answer either way. */
    @Transactional
    public void requestPasswordResetCode(String rawEmail) {
        requestCode(rawEmail, Purpose.PASSWORD_RESET);
    }

    /** Admins have no password: each login is a code emailed to the
     * admin's real inbox (Admin.realEmail), with the same limits as student
     * codes. The same answer whether or not the login exists. If the email
     * can't be sent, the code goes to the server log instead, so the owner
     * (who can read that log) isn't locked out by a mail outage. */
    @Transactional
    public void requestAdminLoginCode(String rawEmail) {
        String email = normalize(rawEmail);
        if (!EmailDomains.isStaffEmail(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Admin logins are " + EmailDomains.STAFF_DOMAIN + " addresses");
        }
        Instant now = Instant.now(clock);
        LocalDate today = LocalDate.now(clock);
        EmailCode row = emailCodeRepository.findByEmail(email).orElseGet(() -> new EmailCode(email));
        requireAllowedToSend(row, now, today);
        com.mealdeck.model.Admin admin = adminRepository.findByEmail(email).orElse(null);
        if (admin == null || admin.getRealEmail() == null || admin.getRealEmail().isBlank()) {
            row.issue(Purpose.ADMIN_LOGIN, null, null, now, today);
            emailCodeRepository.save(row);
            return;
        }
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        row.issue(Purpose.ADMIN_LOGIN, hash(email, code), now.plus(CODE_TTL), now, today);
        emailCodeRepository.save(row);
        try {
            mailer.sendAdminLoginCode(admin.getRealEmail(), code);
        } catch (CodeMailer.MailFailedException e) {
            log.warn("Couldn't email the admin login code for {}; here it is instead: {}", email, code, e);
        }
    }

    /** A code check that keeps a wrong guess's count even though it then
     * fails (its own transaction, not rolled back by the 400). */
    @Transactional(noRollbackFor = ResponseStatusException.class)
    public void consumeAdminLogin(String rawEmail, String code) {
        consume(normalize(rawEmail), code, Purpose.ADMIN_LOGIN);
    }

    private void requireAllowedToSend(EmailCode row, Instant now, LocalDate today) {
        if (row.getLastSentAt() != null && row.getLastSentAt().plus(RESEND_COOLDOWN).isAfter(now)) {
            long wait = Duration.between(now, row.getLastSentAt().plus(RESEND_COOLDOWN)).toSeconds() + 1;
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Wait " + wait + " seconds before asking for another code");
        }
        if (today.equals(row.getSendDay()) && row.getSendsToday() >= MAX_SENDS_PER_DAY) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many codes today. Try again tomorrow");
        }
    }

    private void requestCode(String rawEmail, Purpose purpose) {
        String email = normalize(rawEmail);
        if (!EmailDomains.isStudentEmail(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Only " + EmailDomains.STUDENT_DOMAIN + " emails are accepted");
        }
        Instant now = Instant.now(clock);
        LocalDate today = LocalDate.now(clock);
        EmailCode row = emailCodeRepository.findByEmail(email).orElseGet(() -> new EmailCode(email));

        if (row.getLastSentAt() != null && row.getLastSentAt().plus(RESEND_COOLDOWN).isAfter(now)) {
            long wait = Duration.between(now, row.getLastSentAt().plus(RESEND_COOLDOWN)).toSeconds() + 1;
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Wait " + wait + " seconds before asking for another code");
        }
        if (today.equals(row.getSendDay()) && row.getSendsToday() >= MAX_SENDS_PER_DAY) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many codes today. Try again tomorrow");
        }

        boolean hasAccount = studentRepository.findByEmail(email).isPresent();
        if (hasAccount != (purpose == Purpose.PASSWORD_RESET)) {
            row.issue(purpose, null, null, now, today);
            emailCodeRepository.save(row);
            return;
        }
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        row.issue(purpose, hash(email, code), now.plus(CODE_TTL), now, today);
        emailCodeRepository.save(row);
        try {
            if (purpose == Purpose.SIGNUP) {
                mailer.sendSignupCode(email, code);
            } else {
                mailer.sendPasswordResetCode(email, code);
            }
        } catch (CodeMailer.MailFailedException e) {
            log.warn("Couldn't send {} code to {}", purpose, email, e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Couldn't send the code right now. Try again in a minute");
        }
    }

    /** Called inside StudentService.signup's or resetPassword's
     * transaction, which keeps a wrong guess's attempt count even though
     * the call then fails. Uses up the code on success, so it works once.
     * A code only works for what it was sent for. */
    public void consume(String email, String code, Purpose purpose) {
        EmailCode row = emailCodeRepository.findByEmail(email).orElse(null);
        boolean usable = row != null
                && row.getPurpose() == purpose
                && row.getCodeHash() != null
                && row.getExpiresAt().isAfter(Instant.now(clock))
                && row.getAttempts() < MAX_WRONG_GUESSES;
        if (!usable) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That code has expired. Ask for a new one");
        }
        String given = code == null ? "" : code.trim();
        if (!MessageDigest.isEqual(row.getCodeHash().getBytes(StandardCharsets.UTF_8), hash(email, given).getBytes(StandardCharsets.UTF_8))) {
            row.recordWrongGuess();
            emailCodeRepository.save(row);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That code isn't right");
        }
        emailCodeRepository.delete(row);
    }

    /** Salted with the address, so the same code for two people hashes
     * differently. A 6-digit code is too small a space for a slow hash to
     * matter; the guess limit is what protects it. */
    private static String hash(String email, String code) {
        try {
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(sha.digest((email + ":" + code).getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
