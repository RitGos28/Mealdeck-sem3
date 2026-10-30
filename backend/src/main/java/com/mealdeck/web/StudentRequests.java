package com.mealdeck.web;

public class StudentRequests {

    /** code: the 6-digit code emailed by POST /api/auth/student/signup/code. */
    public record SignupRequest(String email, String code, String password, String confirmPassword, String name, String phone) {
    }

    public record SignupCodeRequest(String email) {
    }

    /** code: the 6-digit code emailed by POST /api/auth/student/password-reset/code. */
    public record PasswordResetRequest(String email, String code, String password, String confirmPassword) {
    }

    private StudentRequests() {
    }
}
