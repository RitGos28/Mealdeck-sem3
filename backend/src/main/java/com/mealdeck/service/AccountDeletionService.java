package com.mealdeck.service;

import com.mealdeck.model.OrderStatus;
import com.mealdeck.model.Student;
import com.mealdeck.repository.OrderRepository;
import com.mealdeck.repository.StudentRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Collection;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** A student deleting their own account. Asking schedules it: the account
 * is deleted for good after a grace period (24 hours), and until then the
 * student or an admin can cancel. The account keeps working during the
 * grace period, except that pickups can't fall after the deletion time and,
 * in the final hour, no new orders can be placed at all. A deletion can't
 * be asked for while an order is still being prepared, and one that comes
 * due while an order is somehow still live waits for it to finish.
 *
 * The final delete is StudentService.deleteByAdmin: the login, details and
 * reports go; past orders stay, anonymised, for the stalls' records.
 *
 * Protected accounts (mealdeck.account.deletion-protected, e.g. the Google
 * Play reviewers' test login) go through the whole flow, but when the grace
 * period ends the request is just cleared instead of deleting the account,
 * so a reviewer trying the button can't lock the next review out. */
@Service
public class AccountDeletionService {

    private static final Logger log = LoggerFactory.getLogger(AccountDeletionService.class);
    private static final ZoneId CAMPUS = ZoneId.of("Asia/Kolkata");
    private static final List<OrderStatus> LIVE = List.of(OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.READY);

    private final StudentRepository studentRepository;
    private final OrderRepository orderRepository;
    private final StudentService studentService;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;
    private final Duration grace;
    private final Duration finalWindow;
    private final java.util.Set<String> protectedEmails;

    public AccountDeletionService(
            StudentRepository studentRepository,
            OrderRepository orderRepository,
            StudentService studentService,
            PasswordEncoder passwordEncoder,
            Clock clock,
            @Value("${mealdeck.account.deletion-grace:PT24H}") Duration grace,
            @Value("${mealdeck.account.deletion-final-window:PT1H}") Duration finalWindow,
            @Value("${mealdeck.account.deletion-protected:}") java.util.List<String> protectedEmails) {
        this.studentRepository = studentRepository;
        this.orderRepository = orderRepository;
        this.studentService = studentService;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
        this.grace = grace;
        this.finalWindow = finalWindow;
        this.protectedEmails = protectedEmails.stream().map(String::trim).map(String::toLowerCase)
                .filter(email -> !email.isEmpty()).collect(java.util.stream.Collectors.toSet());
    }

    /** scheduledFor: when the account will be deleted, or null if no
     * deletion is pending. orderingBlocked: true in the final window. */
    public record Status(Instant scheduledFor, Instant orderingBlockedFrom, boolean orderingBlocked, long graceMinutes) {
    }

    public Status status(Student student) {
        if (student.getDeletionRequestedAt() == null) return new Status(null, null, false, grace.toMinutes());
        Instant deleteAt = deleteAt(student);
        Instant blockedFrom = deleteAt.minus(finalWindow);
        return new Status(deleteAt, blockedFrom, !clock.instant().isBefore(blockedFrom), grace.toMinutes());
    }

    @Transactional
    public Status request(Long studentId, String password) {
        Student student = get(studentId);
        if (password == null || !passwordEncoder.matches(password, student.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "That password isn't right");
        }
        if (student.getDeletionRequestedAt() != null) return status(student);
        if (orderRepository.existsByStudentIdAndStatusIn(studentId, LIVE)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "You have an order in progress. Pick it up (or have the stall cancel it), then delete your account.");
        }
        student.setDeletionRequestedAt(clock.instant());
        log.info("Account deletion scheduled for student {} at {}", studentId, deleteAt(student));
        return status(studentRepository.save(student));
    }

    @Transactional
    public Status cancel(Long studentId) {
        Student student = get(studentId);
        if (student.getDeletionRequestedAt() != null) {
            student.setDeletionRequestedAt(null);
            log.info("Account deletion cancelled for student {}", studentId);
        }
        return status(studentRepository.save(student));
    }

    /** Called by checkout before any order is created. */
    public void requireCanOrder(Student student, Collection<LocalTime> pickupTimes, LocalDate pickupDate) {
        if (student.getDeletionRequestedAt() == null) return;
        Status status = status(student);
        if (status.orderingBlocked()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "This account is scheduled for deletion and can't place orders. Cancel the deletion to order again.");
        }
        for (LocalTime time : pickupTimes) {
            if (time != null && pickupDate.atTime(time).atZone(CAMPUS).toInstant().isAfter(status.orderingBlockedFrom())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Your account is scheduled for deletion, so pick a time before "
                                + status.orderingBlockedFrom().atZone(CAMPUS).format(DateTimeFormatter.ofPattern("h:mm a")));
            }
        }
    }

    /** Deletes every account whose grace period is over. Runs every minute;
     * an account with an order still being prepared waits for the next run
     * after it's finished. */
    @Scheduled(fixedDelayString = "${mealdeck.account.deletion-check:PT1M}")
    public void deleteDueAccounts() {
        for (Student student : studentRepository.findByDeletionRequestedAtLessThanEqual(clock.instant().minus(grace))) {
            if (protectedEmails.contains(student.getEmail().toLowerCase())) {
                student.setDeletionRequestedAt(null);
                studentRepository.save(student);
                log.info("Protected account {}: deletion request cleared instead of deleting", student.getId());
                continue;
            }
            if (orderRepository.existsByStudentIdAndStatusIn(student.getId(), LIVE)) {
                log.info("Account deletion for student {} waits for a live order", student.getId());
                continue;
            }
            studentService.deleteByAdmin(student.getId());
            log.info("Account deleted for student {} after the grace period", student.getId());
        }
    }

    private Instant deleteAt(Student student) {
        return student.getDeletionRequestedAt().plus(grace);
    }

    private Student get(Long studentId) {
        return studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Log in as a student"));
    }
}
