package com.mealdeck.service;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/** Sends sign-up codes through Resend's HTTP API (the same provider
 * mealdeck_improved uses). With no API key configured, or the
 * "<resend api key>" placeholder from .env.example, the code is written to
 * the log instead, so local dev and fresh installs work without email. */
@Component
public class ResendCodeMailer implements CodeMailer {

    private static final Logger log = LoggerFactory.getLogger(ResendCodeMailer.class);

    private final String apiKey;
    private final String from;
    private final RestClient resend;

    public ResendCodeMailer(
            @Value("${mealdeck.mail.resend-api-key:}") String apiKey,
            @Value("${mealdeck.mail.from}") String from) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.from = from;
        SimpleClientHttpRequestFactory requests = new SimpleClientHttpRequestFactory();
        requests.setConnectTimeout(Duration.ofSeconds(5));
        requests.setReadTimeout(Duration.ofSeconds(10));
        this.resend = RestClient.builder().baseUrl("https://api.resend.com").requestFactory(requests).build();
        if (!isConfigured()) {
            log.warn("RESEND_API_KEY is not set: codes will be logged, not emailed");
        }
    }

    private boolean isConfigured() {
        return !apiKey.isEmpty() && !apiKey.startsWith("<");
    }

    @Override
    public void sendSignupCode(String email, String code) {
        send(email, code, "sign-up");
    }

    @Override
    public void sendPasswordResetCode(String email, String code) {
        send(email, code, "password reset");
    }

    @Override
    public void sendAdminLoginCode(String email, String code) {
        send(email, code, "admin login");
    }

    /** kind: "sign-up", "password reset" or "admin login", as it reads in the email. */
    private void send(String email, String code, String kind) {
        if (!isConfigured()) {
            log.info("{} code for {}: {} (not emailed, RESEND_API_KEY unset)", kind, email, code);
            return;
        }
        String expiry = "It expires in " + SignupCodeService.CODE_TTL.toMinutes() + " minutes. If you didn't ask for it, ignore this email.";
        String text = "Your MealDeck " + kind + " code is " + code + ".\n\n" + expiry;
        String html = "<p>Your MealDeck " + kind + " code is</p>"
                + "<p style=\"font-size:28px;font-weight:700;letter-spacing:4px\">" + code + "</p>"
                + "<p>" + expiry + "</p>";
        try {
            resend.post()
                    .uri("/emails")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "from", from,
                            "to", List.of(email),
                            "subject", code + " is your MealDeck " + kind + " code",
                            "text", text,
                            "html", html))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            throw new MailFailedException("Resend rejected the " + kind + " email", e);
        }
    }
}
