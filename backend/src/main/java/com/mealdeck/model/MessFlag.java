package com.mealdeck.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;

/** One student's "this isn't correct" on a mess menu, with what they say it
 * really is. One per student per meal. Plain ids, not foreign keys, so a
 * deleted account can't block anything; MessService removes a student's
 * flags on deletion, and the nightly job drops flags from past days. */
@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"meal_id", "student_id"}))
public class MessFlag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "meal_id", nullable = false)
    private Long mealId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    /** The corrected dishes, one per line, as the student wrote them. */
    @Column(nullable = false, length = 800)
    private String correction;

    @Column(nullable = false)
    private Instant createdAt;

    protected MessFlag() {
    }

    public MessFlag(Long mealId, Long studentId, String correction, Instant createdAt) {
        this.mealId = mealId;
        this.studentId = studentId;
        this.correction = correction;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getMealId() { return mealId; }
    public Long getStudentId() { return studentId; }
    public String getCorrection() { return correction; }
    public Instant getCreatedAt() { return createdAt; }
}
