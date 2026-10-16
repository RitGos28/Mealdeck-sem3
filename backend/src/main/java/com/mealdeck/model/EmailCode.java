package com.mealdeck.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.Instant;
import java.time.LocalDate;

/** The current sign-up code for one email address, plus how often one has
 * been sent. One row per address, overwritten on each new code. Only a hash
 * of the code is stored. A row also exists (with no code) for addresses
 * that already have an account, so they hit the same send limits and a
 * caller can't tell the two apart. */
@Entity
public class EmailCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    private String codeHash;

    private Instant expiresAt;

    @Column(nullable = false)
    private int attempts;

    private Instant lastSentAt;

    /** Campus date sendsToday counts for; a new day starts the count over. */
    private LocalDate sendDay;

    @Column(nullable = false)
    private int sendsToday;

    protected EmailCode() {
    }

    public EmailCode(String email) {
        this.email = email;
    }

    public String getEmail() {
        return email;
    }

    public String getCodeHash() {
        return codeHash;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public int getAttempts() {
        return attempts;
    }

    public Instant getLastSentAt() {
        return lastSentAt;
    }

    public LocalDate getSendDay() {
        return sendDay;
    }

    public int getSendsToday() {
        return sendsToday;
    }

    /** A new code (or none, for an existing account) replaces the old one
     * and resets the wrong-guess count. */
    public void issue(String codeHash, Instant expiresAt, Instant now, LocalDate today) {
        this.codeHash = codeHash;
        this.expiresAt = expiresAt;
        this.attempts = 0;
        this.lastSentAt = now;
        if (!today.equals(sendDay)) {
            sendDay = today;
            sendsToday = 0;
        }
        sendsToday++;
    }

    public void recordWrongGuess() {
        attempts++;
    }
}
