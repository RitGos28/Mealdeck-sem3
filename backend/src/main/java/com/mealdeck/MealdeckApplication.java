package com.mealdeck;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MealdeckApplication {

	public static void main(String[] args) {
		SpringApplication.run(MealdeckApplication.class, args);
	}

}
