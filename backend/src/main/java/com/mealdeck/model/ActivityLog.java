package com.mealdeck.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.Instant;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * One line of the activity trail: who (a student id) did what, when. It
 * holds ids only, never an email or name, and the student id is a plain
 * number rather than a foreign key, so the trail outlives the account:
 * after a deletion the number points at nobody.
 */
@Entity
public class ActivityLog {

    public enum Type {
        ACCOUNT_CREATED,
        OUT_OF_STOCK_REPORTED,
        PREORDER_PLACED,
        DELETION_REQUESTED,
        DELETION_CANCELLED,
        ACCOUNT_DELETED,
        MESS_MEAL_ADDED,
        MESS_FLAGGED,
        MESS_MENU_CORRECTED,
        MESS_MENU_CONFIRMED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Instant createdAt;

    // VARCHAR, not a MySQL ENUM: ddl-auto=update never widens an ENUM, so a
    // new Type would be rejected ("Data truncated") on a live database.
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 32)
    private Type type;

    private Long studentId;

    /** What it was about: the menu item for a report, the order for a preorder. */
    private Long subjectId;

    /** The rest of the sentence after "Student #12", e.g. "created an account". */
    @Column(nullable = false, length = 500)
    private String message;

    protected ActivityLog() {
    }

    public ActivityLog(Instant createdAt, Type type, Long studentId, Long subjectId, String message) {
        this.createdAt = createdAt;
        this.type = type;
        this.studentId = studentId;
        this.subjectId = subjectId;
        this.message = message;
    }

    public Long getId() { return id; }
    public Instant getCreatedAt() { return createdAt; }
    public Type getType() { return type; }
    public Long getStudentId() { return studentId; }
    public Long getSubjectId() { return subjectId; }
    public String getMessage() { return message; }
}
