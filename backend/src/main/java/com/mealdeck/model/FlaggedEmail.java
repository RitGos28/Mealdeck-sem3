package com.mealdeck.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.Instant;

/** An email an admin has flagged as suspicious (pranks, abuse). Stored as
 * a one-way code (EmailKeys), plus a masked hint for the admin list, so it
 * outlives the account: a flagged email can't order or sign up again.
 * blockedUntil null means until an admin removes the flag. */
@Entity
public class FlaggedEmail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String emailKey;

    @Column(nullable = false)
    private String hint;

    @Column(nullable = false, length = 500)
    private String reason;

    private Instant blockedUntil;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected FlaggedEmail() {
    }

    public FlaggedEmail(String emailKey, String hint, String reason, Instant blockedUntil) {
        this.emailKey = emailKey;
        this.hint = hint;
        this.reason = reason;
        this.blockedUntil = blockedUntil;
    }

    public Long getId() { return id; }
    public String getEmailKey() { return emailKey; }
    public String getHint() { return hint; }
    public String getReason() { return reason; }
    public Instant getBlockedUntil() { return blockedUntil; }
    public Instant getCreatedAt() { return createdAt; }
    public void setReason(String reason) { this.reason = reason; }
    public void setBlockedUntil(Instant blockedUntil) { this.blockedUntil = blockedUntil; }
}
