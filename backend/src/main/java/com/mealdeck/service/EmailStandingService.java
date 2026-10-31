package com.mealdeck.service;

import com.mealdeck.model.FlaggedEmail;
import com.mealdeck.model.Student;
import com.mealdeck.repository.FlaggedEmailRepository;
import com.mealdeck.repository.OrderRepository;
import com.mealdeck.repository.StudentRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Stops one person wasting stalls' food with pre-orders they never
 * collect, even across deleting and re-creating their account:
 *
 * - Automatic: an email with `limit` no-shows within `windowDays` can't
 *   pre-order until the older one ages out. Counted from a one-way email
 *   code kept on orders (EmailKeys), which survives account deletion and
 *   is wiped once an order is older than the window.
 * - Manual: an admin can flag an email ("suspicious emails"); it then can't
 *   order or sign up until the flag ends or is removed.
 *
 * Picked up late (NO_SHOW then COMPLETED) doesn't count: only orders still
 * NO_SHOW do. */
@Service
public class EmailStandingService {

    private static final Logger log = LoggerFactory.getLogger(EmailStandingService.class);
    private static final ZoneId CAMPUS = ZoneId.of("Asia/Kolkata");
    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("d MMM");

    private final EmailKeys emailKeys;
    private final OrderRepository orderRepository;
    private final FlaggedEmailRepository flaggedEmailRepository;
    private final StudentRepository studentRepository;
    private final Clock clock;
    private final int limit;
    private final int windowDays;

    public EmailStandingService(EmailKeys emailKeys, OrderRepository orderRepository, FlaggedEmailRepository flaggedEmailRepository,
            StudentRepository studentRepository, Clock clock,
            @Value("${mealdeck.abuse.no-show-limit:2}") int limit,
            @Value("${mealdeck.abuse.no-show-window-days:30}") int windowDays) {
        this.emailKeys = emailKeys;
        this.orderRepository = orderRepository;
        this.flaggedEmailRepository = flaggedEmailRepository;
        this.studentRepository = studentRepository;
        this.clock = clock;
        this.limit = limit;
        this.windowDays = windowDays;
    }

    public String keyFor(String email) {
        return emailKeys.key(email);
    }

    /** Called by checkout before any order is created. */
    public void requireCanOrder(Student student) {
        String key = emailKeys.key(student.getEmail());
        activeFlag(key).ifPresent(flag -> {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Pre-ordering is paused for this account. Email ritwik@mealdeck.in if you think this is a mistake.");
        });
        LocalDate today = LocalDate.now(clock.withZone(CAMPUS));
        List<LocalDate> noShows = orderRepository.noShowDates(key, today.minusDays(windowDays - 1L));
        if (noShows.size() >= limit) {
            LocalDate until = noShows.get(limit - 1).plusDays(windowDays);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You didn't collect " + noShows.size() + " pre-orders in the last " + windowDays + " days, so pre-ordering is paused until "
                            + until.format(DAY) + ". You can still buy at the counter.");
        }
    }

    /** Called before a sign-up code is sent and at sign-up. */
    public void requireCanSignUp(String email) {
        if (activeFlag(emailKeys.key(email)).isPresent()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This email can't be used on MealDeck. Email ritwik@mealdeck.in if you think this is a mistake.");
        }
    }

    private java.util.Optional<FlaggedEmail> activeFlag(String key) {
        Instant now = clock.instant();
        return flaggedEmailRepository.findByEmailKey(key).filter(flag -> flag.getBlockedUntil() == null || flag.getBlockedUntil().isAfter(now));
    }

    /** One row in the admin's "Suspicious emails" list. */
    public record Entry(Long id, String hint, String source, String reason, Instant blockedUntil, long noShows, String pausedUntil) {
    }

    /** Manual flags, then emails paused automatically by no-shows. */
    public List<Entry> list() {
        List<Entry> entries = new ArrayList<>();
        for (FlaggedEmail flag : flaggedEmailRepository.findAllByOrderByCreatedAtDesc()) {
            entries.add(new Entry(flag.getId(), flag.getHint(), "ADMIN", flag.getReason(), flag.getBlockedUntil(), 0, null));
        }
        // Hints for automatic entries come from accounts that still exist.
        Map<String, String> hints = new HashMap<>();
        for (Student student : studentRepository.findAll()) hints.put(emailKeys.key(student.getEmail()), EmailKeys.hint(student.getEmail()));
        LocalDate today = LocalDate.now(clock.withZone(CAMPUS));
        for (Object[] row : orderRepository.repeatNoShows(today.minusDays(windowDays - 1L), limit)) {
            String key = (String) row[0];
            List<LocalDate> dates = orderRepository.noShowDates(key, today.minusDays(windowDays - 1L));
            entries.add(new Entry(null, hints.getOrDefault(key, "(account deleted)"), "NO_SHOWS",
                    dates.size() + " uncollected pre-orders in " + windowDays + " days", null, dates.size(),
                    dates.get(limit - 1).plusDays(windowDays).toString()));
        }
        return entries;
    }

    @Transactional
    public Entry flag(String email, String reason, Integer days) {
        if (email == null || email.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        if (reason == null || reason.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Say why it's flagged");
        String key = emailKeys.key(email);
        Instant until = days == null ? null : clock.instant().plusSeconds(days * 86_400L);
        FlaggedEmail flag = flaggedEmailRepository.findByEmailKey(key)
                .orElseGet(() -> new FlaggedEmail(key, EmailKeys.hint(email), reason.trim(), until));
        flag.setReason(reason.trim());
        flag.setBlockedUntil(until);
        flag = flaggedEmailRepository.save(flag);
        log.info("Email flagged by admin: {}", flag.getHint());
        return new Entry(flag.getId(), flag.getHint(), "ADMIN", flag.getReason(), flag.getBlockedUntil(), 0, null);
    }

    @Transactional
    public void unflag(Long id) {
        flaggedEmailRepository.deleteById(id);
    }

    /** Daily: email codes on orders older than the window are wiped. */
    @Scheduled(cron = "0 30 3 * * *", zone = "Asia/Kolkata")
    @Transactional
    public void forgetOldEmailKeys() {
        LocalDate today = LocalDate.now(clock.withZone(CAMPUS));
        int wiped = orderRepository.forgetEmailKeysBefore(today.minusDays(windowDays - 1L));
        if (wiped > 0) log.info("Wiped email codes from {} orders older than {} days", wiped, windowDays);
    }
}
