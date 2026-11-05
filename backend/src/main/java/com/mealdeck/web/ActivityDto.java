package com.mealdeck.web;

import com.mealdeck.model.ActivityLog;
import java.time.Instant;

/** text reads as a sentence: "Student #12 created an account". */
public record ActivityDto(Long id, Instant at, String type, Long studentId, Long subjectId, String text) {

    public static ActivityDto from(ActivityLog entry) {
        String who = entry.getStudentId() == null ? "Someone" : "Student #" + entry.getStudentId();
        return new ActivityDto(entry.getId(), entry.getCreatedAt(), entry.getType().name(),
                entry.getStudentId(), entry.getSubjectId(), who + " " + entry.getMessage());
    }
}
