package com.mealdeck.service;

/** Sends a sign-up or password-reset code to a student's inbox. An
 * interface so tests can capture the code instead of emailing it. */
public interface CodeMailer {

    /** Throws MailFailedException if the email couldn't be handed off. */
    void sendSignupCode(String email, String code);

    /** Throws MailFailedException if the email couldn't be handed off. */
    void sendPasswordResetCode(String email, String code);

    /** An admin's login code, to their real inbox. Throws MailFailedException
     * if the email couldn't be handed off. */
    void sendAdminLoginCode(String email, String code);

    class MailFailedException extends RuntimeException {

        public MailFailedException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
