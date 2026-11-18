package com.mealdeck.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * One meal of the campus mess on one day, as the students wrote it. The
 * first submission for a (date, meal) becomes the menu; three different
 * students flagging it can replace it (MessService); an admin can confirm
 * it, which locks it. The submitter is a plain student number, not a
 * foreign key, and is cleared when that student's account is deleted.
 */
@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"meal_date", "meal"}))
public class MessMeal {

    public enum Meal {
        BREAKFAST("Breakfast"), LUNCH("Lunch"), SNACKS("Snacks"), DINNER("Dinner");

        private final String label;

        Meal(String label) { this.label = label; }

        public String label() { return label; }
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "meal_date", nullable = false)
    private LocalDate date;

    // VARCHAR, not a MySQL ENUM: ddl-auto=update never widens an ENUM.
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 16)
    private Meal meal;

    /** The dishes, one per line. */
    @Column(nullable = false, length = 800)
    private String items;

    /** Null once that student's account is deleted, or for an admin's entry. */
    private Long submittedByStudentId;

    @Column(nullable = false)
    private Instant createdAt;

    /** Boxed so ddl-auto=update can add the column; null means not locked. */
    private Boolean locked;

    /** Set when an admin confirms the menu as correct (which also locks it). */
    private Instant confirmedAt;

    protected MessMeal() {
    }

    public MessMeal(LocalDate date, Meal meal, List<String> dishes, Long submittedByStudentId, Instant createdAt) {
        this.date = date;
        this.meal = meal;
        this.items = String.join("\n", dishes);
        this.submittedByStudentId = submittedByStudentId;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public LocalDate getDate() { return date; }
    public Meal getMeal() { return meal; }
    public List<String> getDishes() { return Arrays.asList(items.split("\n")); }
    public void setDishes(List<String> dishes) { this.items = String.join("\n", dishes); }
    public Long getSubmittedByStudentId() { return submittedByStudentId; }
    public void setSubmittedByStudentId(Long id) { this.submittedByStudentId = id; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public boolean isLocked() { return Boolean.TRUE.equals(locked); }
    public Instant getConfirmedAt() { return confirmedAt; }

    /** An admin's "this is correct": checked and locked. */
    public void confirm(Instant at) {
        this.locked = true;
        this.confirmedAt = at;
    }

    public void unlock() {
        this.locked = false;
        this.confirmedAt = null;
    }
}
