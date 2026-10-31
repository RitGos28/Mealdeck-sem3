package com.mealdeck.service;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** A one-way code for an email address (HMAC-SHA256 with a server secret),
 * so no-show limits and flags can follow an email after its account is
 * deleted, without keeping a readable list of emails. Without the secret
 * the code can't be turned back into the address, even by guessing
 * likely Bennett addresses. */
@Component
public class EmailKeys {

    private static final Logger log = LoggerFactory.getLogger(EmailKeys.class);
    private static final String DEV_SECRET = "dev-only-abuse-secret";

    private final SecretKeySpec secret;

    /** ABUSE_SECRET if it's set. Otherwise a key derived from the database
     * password (secret on the server, and stable across restarts, so counts
     * and flags survive). The public development secret only applies when
     * there's no database password either, i.e. local demo runs. */
    public EmailKeys(@Value("${mealdeck.abuse.secret:" + DEV_SECRET + "}") String secret,
            @Value("${spring.datasource.password:}") String databasePassword) {
        String chosen = secret;
        if (DEV_SECRET.equals(secret) && databasePassword != null && !databasePassword.isBlank()) {
            chosen = derive(databasePassword);
            log.warn("ABUSE_SECRET is not set: deriving the email-code secret from the database password. Set ABUSE_SECRET to make it independent.");
        } else if (DEV_SECRET.equals(secret)) {
            log.warn("ABUSE_SECRET is not set: using the development secret for email codes (fine for local demo runs only)");
        }
        this.secret = new SecretKeySpec(chosen.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    private static String derive(String databasePassword) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(databasePassword.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal("mealdeck-email-codes-v1".getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("HmacSHA256 unavailable", e);
        }
    }

    public String key(String email) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(secret);
            return HexFormat.of().formatHex(mac.doFinal(email.trim().toLowerCase().getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("HmacSHA256 unavailable", e);
        }
    }

    /** "ri•••@bennett.edu.in": enough for an admin to tell entries apart. */
    public static String hint(String email) {
        String e = email.trim().toLowerCase();
        int at = e.indexOf('@');
        if (at <= 0) return "•••";
        return e.substring(0, Math.min(2, at)) + "•••" + e.substring(at);
    }
}
