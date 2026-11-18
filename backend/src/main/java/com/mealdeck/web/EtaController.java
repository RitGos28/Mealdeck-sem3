package com.mealdeck.web;

import com.mealdeck.service.EtaService;
import com.mealdeck.service.EtaService.BasketLine;
import java.time.LocalTime;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/** Checkout asks for a preparation-time estimate per stall. 204 No Content
 * means "no estimate" (turned off, or the model is unavailable), and the
 * checkout simply shows nothing. */
@RestController
public class EtaController {

    private final EtaService etaService;

    public EtaController(EtaService etaService) {
        this.etaService = etaService;
    }

    public record EtaRequest(List<BasketLine> items, LocalTime pickupTime) {
    }

    public record EtaDto(double minutes, double low, double high, boolean simulated) {
    }

    /** Per stall taking pre-orders: about how long a new order would take
     * right now. Empty when estimates are off. */
    @GetMapping("/api/stalls/waits")
    public List<EtaService.StallWait> waits() {
        return etaService.stallWaits();
    }

    @PostMapping("/api/stalls/{id}/eta")
    public ResponseEntity<EtaDto> eta(@PathVariable Long id, @RequestBody EtaRequest request) {
        return etaService.estimate(id, request.items(), request.pickupTime())
                .map(p -> ResponseEntity.ok(new EtaDto(p.minutes(), p.low(), p.high(), p.simulated())))
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
