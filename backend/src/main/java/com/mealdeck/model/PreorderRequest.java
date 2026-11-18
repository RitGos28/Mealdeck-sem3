package com.mealdeck.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;

/** A student saying "I'd pre-order at this stall". Counted per stall and
 * shown to admins, as proof of demand when asking a stall to join. One per
 * student per stall. Plain ids, not foreign keys: MealDeck removes a
 * student's requests when their account goes, and a stall's when it's deleted. */
@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"stall_id", "student_id"}))
public class PreorderRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stall_id", nullable = false)
    private Long stallId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(nullable = false)
    private Instant createdAt;

    protected PreorderRequest() {
    }

    public PreorderRequest(Long stallId, Long studentId, Instant createdAt) {
        this.stallId = stallId;
        this.studentId = studentId;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getStallId() { return stallId; }
    public Long getStudentId() { return studentId; }
    public Instant getCreatedAt() { return createdAt; }
}
