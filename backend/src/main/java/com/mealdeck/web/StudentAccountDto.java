package com.mealdeck.web;

import com.mealdeck.model.Student;

/** Safe admin view: deliberately omits the password hash. */
/** deletionRequestedAt: when the student asked to delete their account, or
 * null; the admin can cancel it until the grace period runs out. */
public record StudentAccountDto(Long id, String email, String name, String phone, java.time.Instant deletionRequestedAt) {
    public static StudentAccountDto from(Student student) {
        return new StudentAccountDto(student.getId(), student.getEmail(), student.getName(), student.getPhone(), student.getDeletionRequestedAt());
    }
}
