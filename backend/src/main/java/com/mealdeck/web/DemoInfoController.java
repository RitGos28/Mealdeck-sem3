package com.mealdeck.web;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Tells the app whether it's showing simulated history (a local demo run
 * with DEMO_HISTORY=true), so it can say so in a banner. Always false in
 * production: the history seeder only exists in the demo profile. */
@RestController
public class DemoInfoController {

    public record DemoInfo(boolean simulatedData) {
    }

    private final boolean simulatedData;

    public DemoInfoController(Environment environment, @Value("${mealdeck.demo.history:false}") boolean history) {
        this.simulatedData = history && environment.acceptsProfiles(Profiles.of("demo"));
    }

    @GetMapping("/api/demo-info")
    public DemoInfo info() {
        return new DemoInfo(simulatedData);
    }
}
