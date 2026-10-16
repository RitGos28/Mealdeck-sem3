package com.mealdeck;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/** Pins the campus clock to 10:00 IST on 2026-09-29, and swaps Resend for a
 * RecordingCodeMailer so sign-up tests can read the code. Shared through @Import
 * rather than nested per class, so every test class importing it (with the
 * same profile and no extra mocks) reuses one cached Spring context instead
 * of re-creating the schema and re-seeding for each. */
@TestConfiguration
public class FixedClockConfig {

    public static final Instant NOW = Instant.parse("2026-09-29T04:30:00Z");

    @Bean
    @Primary
    Clock testClock() {
        return Clock.fixed(NOW, ZoneId.of("Asia/Kolkata"));
    }

    @Bean
    @Primary
    RecordingCodeMailer recordingCodeMailer() {
        return new RecordingCodeMailer();
    }
}
