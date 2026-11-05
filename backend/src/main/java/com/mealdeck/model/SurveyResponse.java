package com.mealdeck.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.Instant;

/** A student's answers to the four questions in Account (where they heard of
 * MealDeck, what convinced them, what else they want, what frustrates them).
 * One per student, editable. Tied to the student by a plain number and
 * removed when their account is deleted. */
@Entity
public class SurveyResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long studentId;

    @Column(length = 30)
    private String source;

    @Column(length = 120)
    private String sourceOther;

    /** Feature keys, comma-separated. */
    @Column(length = 300)
    private String features;

    @Column(length = 600)
    private String featuresOther;

    @Column(length = 600)
    private String wishes;

    @Column(length = 600)
    private String frustrations;

    @Column(nullable = false)
    private Instant updatedAt;

    protected SurveyResponse() {
    }

    public SurveyResponse(Long studentId) {
        this.studentId = studentId;
    }

    public Long getId() { return id; }
    public Long getStudentId() { return studentId; }
    public String getSource() { return source; }
    public String getSourceOther() { return sourceOther; }
    public String getFeatures() { return features; }
    public String getFeaturesOther() { return featuresOther; }
    public String getWishes() { return wishes; }
    public String getFrustrations() { return frustrations; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void answer(String source, String sourceOther, String features, String featuresOther, String wishes, String frustrations, Instant at) {
        this.source = source;
        this.sourceOther = sourceOther;
        this.features = features;
        this.featuresOther = featuresOther;
        this.wishes = wishes;
        this.frustrations = frustrations;
        this.updatedAt = at;
    }
}
