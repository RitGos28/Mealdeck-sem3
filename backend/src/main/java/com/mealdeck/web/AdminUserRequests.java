package com.mealdeck.web;

/** Requests used only by the administrator's account-management screens. */
public class AdminUserRequests {
    public record CreateStudentRequest(String email, String password, String name, String phone) { }
    /** Leave a field null to retain its current value; password is never returned. */
    public record UpdateStudentRequest(String email, String password, String name, String phone) { }
    /** A vendor is created together with a stall by CreateStallRequest. */
    public record UpdateVendorRequest(String email, String password, String realEmail) { }
    private AdminUserRequests() { }
}
