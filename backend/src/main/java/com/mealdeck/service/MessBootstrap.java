package com.mealdeck.service;

import com.mealdeck.model.MessMeal.Meal;
import com.mealdeck.model.MessPrice;
import com.mealdeck.repository.MessPriceRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Seeds the one mess price we know: lunch is Rs 70 for day scholars
 * (confirmed). The others stay empty ("Price at the counter") until an
 * admin sets them. Never overwrites a price an admin already chose. */
@Component
public class MessBootstrap implements CommandLineRunner {

    private final MessPriceRepository prices;

    public MessBootstrap(MessPriceRepository prices) {
        this.prices = prices;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!prices.existsById(Meal.LUNCH)) {
            prices.save(new MessPrice(Meal.LUNCH, 70));
        }
    }
}
