package com.mealdeck;

import com.mealdeck.service.CodeMailer;
import java.util.HashMap;
import java.util.Map;

/** Stands in for Resend in tests: keeps the last code sent to each address
 * so a test can type it in, and can be told to fail the next send. */
public class RecordingCodeMailer implements CodeMailer {

    private final Map<String, String> lastCode = new HashMap<>();
    private boolean failNext;

    @Override
    public void sendSignupCode(String email, String code) {
        if (failNext) {
            failNext = false;
            throw new MailFailedException("simulated Resend outage", null);
        }
        lastCode.put(email, code);
    }

    @Override
    public void sendPasswordResetCode(String email, String code) {
        sendSignupCode(email, code);
    }

    @Override
    public void sendAdminLoginCode(String email, String code) {
        sendSignupCode(email, code);
    }

    public String lastCodeFor(String email) {
        return lastCode.get(email);
    }

    public boolean sentTo(String email) {
        return lastCode.containsKey(email);
    }

    public void failNextSend() {
        failNext = true;
    }

    public void clear() {
        lastCode.clear();
        failNext = false;
    }
}
