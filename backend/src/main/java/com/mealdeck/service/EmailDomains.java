package com.mealdeck.service;

/** Which email domain each role is allowed to sign in with. Students use
 * their real Bennett inbox directly; vendor/admin emails are @mealdeck.in
 * identities (see Vendor.realEmail / Admin.realEmail). Everything else,
 * a personal Gmail typed straight into the login form, is rejected. */
public final class EmailDomains {

    public static final String STUDENT_DOMAIN = "@bennett.edu.in";
    public static final String STAFF_DOMAIN = "@mealdeck.in";

    /** A plain Bennett address. "+" aliases (asha+1@bennett.edu.in) are
     * refused: Google delivers them to the same inbox, so they'd let one
     * student open any number of accounts. */
    public static boolean isStudentEmail(String email) {
        return studentEmailProblem(email) == null;
    }

    /** Why this can't be a student's email, or null if it can. */
    public static String studentEmailProblem(String email) {
        if (email == null || !email.toLowerCase().endsWith(STUDENT_DOMAIN)) return "Only " + STUDENT_DOMAIN + " emails are accepted";
        if (email.substring(0, email.length() - STUDENT_DOMAIN.length()).contains("+")) return "Use your plain Bennett address, without a + part";
        return null;
    }

    public static boolean isStaffEmail(String email) {
        return email != null && email.toLowerCase().endsWith(STAFF_DOMAIN);
    }

    private EmailDomains() {
    }
}
