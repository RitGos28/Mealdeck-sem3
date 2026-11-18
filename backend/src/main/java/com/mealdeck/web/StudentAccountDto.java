package com.mealdeck.web;

import com.mealdeck.model.Student;

/** Safe admin view: deliberately omits the password hash. */
/** deletionRequestedAt: when the student asked to delete their account, or
 * null; the admin can cancel it until the grace period runs out.
 * deletionScheduledFor: when it will actually happen (the server's grace
 * period after the request), or null if none is pending. */
public record StudentAccountDto(Long id, String email, String name, String phone, java.time.Instant deletionRequestedAt, java.time.Instant deletionScheduledFor) {
    public static StudentAccountDto from(Student student, com.mealdeck.service.AccountDeletionService accountDeletion) {
        return new StudentAccountDto(student.getId(), student.getEmail(), student.getName(), student.getPhone(),
                student.getDeletionRequestedAt(), accountDeletion.status(student).scheduledFor());
    }
}
