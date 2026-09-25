package com.mealdeck.service;

/** Which email domain each role is allowed to sign in with. Students use
 * their real Bennett inbox directly; vendor/admin emails are @mealdeck.in
 * identities (see Vendor.realEmail / Admin.realEmail). Everything else,
 * a personal Gmail typed straight into the login form, is rejected. */
public final class EmailDomains {

    public static final String STUDENT_DOMAIN = "@bennett.edu.in";
    public static final String STAFF_DOMAIN = "@mealdeck.in";

    public static boolean isStudentEmail(String email) {
        return email != null && email.toLowerCase().endsWith(STUDENT_DOMAIN);
    }

    public static boolean isStaffEmail(String email) {
        return email != null && email.toLowerCase().endsWith(STAFF_DOMAIN);
    }

    private EmailDomains() {
    }
}
