package com.mealdeck.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;

/** Login identity for a stall's owner. Kept separate from Stall so the
 * public menu DTOs never risk leaking a password hash. */
@Entity
public class Vendor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @OneToOne
    @JoinColumn(name = "stall_id", nullable = false, unique = true)
    private Stall stall;

    protected Vendor() {
    }

    public Vendor(String email, String passwordHash, Stall stall) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.stall = stall;
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public Stall getStall() {
        return stall;
    }
}
