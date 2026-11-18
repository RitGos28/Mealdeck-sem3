package com.mealdeck.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;

/** A student's verdict on a dish they've picked up: "Amazing" or "Not worth
 * it". Shown to everyone only as counts, never with who voted. One per
 * student per dish; changing your mind replaces it. Deleted with the
 * account. */
@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "menu_item_id"}))
public class DishVote {

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
    private boolean amazing;

    @Column(nullable = false)
    private Instant createdAt;

    protected DishVote() {
    }

    public DishVote(Student student, MenuItem menuItem, boolean amazing, Instant createdAt) {
        this.student = student;
        this.menuItem = menuItem;
        this.amazing = amazing;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public MenuItem getMenuItem() {
        return menuItem;
    }

    public boolean isAmazing() {
        return amazing;
    }

    public void setAmazing(boolean amazing) {
        this.amazing = amazing;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
