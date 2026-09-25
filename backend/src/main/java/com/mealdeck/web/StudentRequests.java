package com.mealdeck.web;

public class StudentRequests {

    public record SignupRequest(String email, String password, String confirmPassword, String name, String phone) {
    }

    private StudentRequests() {
    }
}
