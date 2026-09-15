package com.mealdeck.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.time.Instant;

/**
 * One "out of stock" vote against a menu item. No auth yet, so this is an
 * anonymous count-based signal, same shape as mealdeck_improved's reporting
 * mechanism (report_count / REPORT_THRESHOLD), just without the per-user
 * dedupe that requires a logged-in identity.
 */
@Entity
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected Report() {
    }

    public Report(MenuItem menuItem) {
        this.menuItem = menuItem;
    }

    public Long getId() {
        return id;
    }

    public MenuItem getMenuItem() {
        return menuItem;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
