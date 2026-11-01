package com.mealdeck.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.Instant;
import java.time.LocalDate;

/** The current emailed code for one address (sign-up or password reset),
 * plus how often one has been sent. One row per address, overwritten on
 * each new code, so both kinds share the send limits. Only a hash of the
 * code is stored. A row also exists (with no code) when a send was asked
 * for but skipped -- sign-up for an address that has an account, reset for
 * one that doesn't -- so a caller can't tell the cases apart. */
@Entity
public class EmailCode {

    /** What a code was sent for; a code only works for that. */
    public enum Purpose { SIGNUP, PASSWORD_RESET, ADMIN_LOGIN }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    private String codeHash;

    // Plain text, not a MySQL ENUM: ddl-auto=update never edits an ENUM's
    // value list, so a new value would be rejected ("Data truncated").
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 32)
    private Purpose purpose;

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

    public Purpose getPurpose() {
        return purpose;
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

    /** A new code (or none, when the send was skipped) replaces the old one
     * and resets the wrong-guess count. */
    public void issue(Purpose purpose, String codeHash, Instant expiresAt, Instant now, LocalDate today) {
        this.purpose = purpose;
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
