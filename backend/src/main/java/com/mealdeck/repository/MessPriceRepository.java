package com.mealdeck.repository;

import com.mealdeck.model.MessMeal.Meal;
import com.mealdeck.model.MessPrice;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessPriceRepository extends JpaRepository<MessPrice, Meal> {
}
