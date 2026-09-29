package com.mealdeck.web;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Liveness check for Docker's healthcheck (and later, uptime monitoring).
 * Deliberately outside /api so nginx never exposes it publicly. */
@RestController
public class HealthController {

    @GetMapping("/healthz")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }
}
