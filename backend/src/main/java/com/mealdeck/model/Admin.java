package com.mealdeck.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Admin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    /** Same idea as Vendor.realEmail: email is a @mealdeck.in identity, this
     * is the real inbox OTP delivery will send to once that's built. */
    private String realEmail;

    protected Admin() {
    }

    public Admin(String email, String passwordHash, String realEmail) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.realEmail = realEmail;
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

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getRealEmail() {
        return realEmail;
    }
}
