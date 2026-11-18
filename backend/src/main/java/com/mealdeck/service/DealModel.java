package com.mealdeck.service;

import com.mealdeck.model.MenuItem;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** Online logistic regression on dish features: how likely a dish is to be
 * kept in "Deal me a dish". Each swipe nudges the weights (one step of
 * stochastic gradient descent), so it keeps learning as people play.
 *
 * Features are sparse and binary: the stall, the menu section, a price band,
 * veg or not, and the words in the dish's name ("paneer", "coffee"), which
 * is what lets a liking for paneer at one stall carry over to another.
 *
 * Not thread-safe; DealLearningService guards each instance. */
public class DealModel {

    static final double LEARNING_RATE = 0.15;
    static final double L2 = 0.001;

    private final Map<String, Double> weights = new HashMap<>();
    private int updates;

    /** The dish's features, as names; each is worth 1. */
    static List<String> features(MenuItem item) {
        List<String> features = new ArrayList<>();
        features.add("bias");
        features.add("stall:" + item.getStall().getId());
        String category = item.getCategory();
        features.add("section:" + (category == null || category.isBlank() ? "-" : category.trim().toLowerCase(Locale.ROOT)));
        features.add("price:" + priceBand(item.getPrice()));
        features.add(item.isVeg() ? "veg" : "nonveg");
        for (String word : item.getName().toLowerCase(Locale.ROOT).split("[^\\p{L}]+")) {
            if (word.length() >= 3) features.add("word:" + word);
        }
        return features;
    }

    static String priceBand(BigDecimal price) {
        int rupees = price == null ? 0 : price.intValue();
        if (rupees < 100) return "under100";
        if (rupees < 150) return "100-149";
        if (rupees < 250) return "150-249";
        return "250plus";
    }

    /** The raw score, before the sigmoid. */
    public double logit(MenuItem item) {
        double sum = 0;
        for (String feature : features(item)) sum += weights.getOrDefault(feature, 0.0);
        return sum;
    }

    /** One gradient step towards `kept`, on top of `offset` (another
     * model's logit, so a personal model only learns how this student
     * differs from everyone). */
    public void learn(MenuItem item, boolean kept, double offset) {
        List<String> features = features(item);
        double error = (kept ? 1 : 0) - sigmoid(offset + logit(item));
        for (String feature : features) {
            double w = weights.getOrDefault(feature, 0.0);
            weights.put(feature, w + LEARNING_RATE * (error - L2 * w));
        }
        updates++;
    }

    public int updates() {
        return updates;
    }

    public static double sigmoid(double x) {
        return 1 / (1 + Math.exp(-x));
    }
}
