package com.mealdeck;

import org.springframework.boot.SpringApplication;
import java.time.Clock;
import java.time.ZoneId;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MealdeckApplication {

	public static void main(String[] args) {
		SpringApplication.run(MealdeckApplication.class, args);
	}

	/** Pickup slots are campus wall-clock times, so "today" and "is this slot
	 * still in the future" are read in IST, not the server's own zone (a
	 * container defaults to UTC). A bean rather than a static so tests can
	 * pin the time. */
	@Bean
	public Clock campusClock() {
		return Clock.system(ZoneId.of("Asia/Kolkata"));
	}

}
