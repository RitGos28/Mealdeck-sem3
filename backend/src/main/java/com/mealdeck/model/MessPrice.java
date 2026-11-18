package com.mealdeck.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** What a mess plate costs a day scholar for one meal (hostellers pay
 * nothing: it's in their fees). A missing price shows as "Price at the
 * counter". Admin-editable. */
@Entity
public class MessPrice {

    @Id
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 16)
    private MessMeal.Meal meal;

    private Integer priceInr;

    protected MessPrice() {
    }

    public MessPrice(MessMeal.Meal meal, Integer priceInr) {
        this.meal = meal;
        this.priceInr = priceInr;
    }

    public MessMeal.Meal getMeal() { return meal; }
    public Integer getPriceInr() { return priceInr; }
    public void setPriceInr(Integer priceInr) { this.priceInr = priceInr; }
}
