package com.mealdeck.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.time.Instant;

/** One keep or skip in "Deal me a dish", by a logged-in student who hasn't
 * turned learning off. The deal model trains on these. Deleted when the
 * student turns learning off or deletes their account. */
@Entity
public class DealSwipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    @Column(nullable = false)
    private boolean kept;

    @Column(nullable = false)
    private Instant createdAt;

    protected DealSwipe() {
    }

    public DealSwipe(Student student, MenuItem menuItem, boolean kept, Instant createdAt) {
        this.student = student;
        this.menuItem = menuItem;
        this.kept = kept;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public Student getStudent() {
        return student;
    }

    public MenuItem getMenuItem() {
        return menuItem;
    }

    public boolean isKept() {
        return kept;
    }
}
