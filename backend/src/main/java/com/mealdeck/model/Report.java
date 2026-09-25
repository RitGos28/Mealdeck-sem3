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
 * One student's "out of stock" vote against a menu item: the three-strike
 * system. A student can vote once per item, then again after a cooldown
 * (see MenuService.REPORT_COOLDOWN_HOURS) if it's still showing available;
 * three votes within that window auto-hides the item. Marking an item
 * available again clears its votes so students can report it fresh after
 * a restock.
 */
@Entity
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected Report() {
    }

    public Report(MenuItem menuItem, Student student) {
        this.menuItem = menuItem;
        this.student = student;
    }

    public Long getId() {
        return id;
    }

    public MenuItem getMenuItem() {
        return menuItem;
    }

    public Student getStudent() {
        return student;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
