package com.mealdeck.web;

import com.mealdeck.model.Student;

/** Safe admin view: deliberately omits the password hash. */
public record StudentAccountDto(Long id, String email, String name, String phone) {
    public static StudentAccountDto from(Student student) {
        return new StudentAccountDto(student.getId(), student.getEmail(), student.getName(), student.getPhone());
    }
}
