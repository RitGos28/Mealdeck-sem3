package com.mealdeck.service;

import java.util.List;
import java.util.Optional;

/** The pickup-ETA model (ml/serve_eta.py). An interface so EtaService can be
 * tested without the Python server running. */
public interface EtaModelClient {

    /** Empty when the model can't be reached or doesn't answer in time:
     * checkout never waits on, or fails because of, an estimate. */
    Optional<Prediction> predict(Query query);

    /** One dish in the basket. The model buckets it into a prep class from
     * its name and category (category may be null). */
    record Line(String name, String category, int quantity) {
    }

    /** weekday: 0 = Monday. ordersAhead: unfinished orders at the stall
     * before this one. slotLoad: orders already booked in the chosen slot. */
    record Query(List<Line> items, int hour, int weekday, int ordersAhead, int slotLoad) {
    }

    /** minutes is the model's estimate; low and high are a rough spread
     * across its trees. simulated: the model was trained on simulated
     * orders, not real ones. */
    record Prediction(double minutes, double low, double high, boolean simulated) {
    }
}
