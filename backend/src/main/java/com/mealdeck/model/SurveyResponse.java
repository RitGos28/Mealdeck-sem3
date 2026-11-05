package com.mealdeck.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.Instant;

/** A student's answers to the Account questionnaire (the questions live in
 * SurveyService, so they can change without a schema change). One per
 * student, editable, tied to the student by a plain number, and removed when
 * their account is deleted. */
@Entity
public class SurveyResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long studentId;

    /** The answers as JSON: question id to a choice key, a list of keys, or text. */
    @Column(nullable = false, length = 4000)
    private String answers;

    @Column(nullable = false)
    private Instant updatedAt;

    protected SurveyResponse() {
    }

    public SurveyResponse(Long studentId) {
        this.studentId = studentId;
    }

    public Long getId() { return id; }
    public Long getStudentId() { return studentId; }
    public String getAnswers() { return answers; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void answer(String answers, Instant at) {
        this.answers = answers;
        this.updatedAt = at;
    }
}
