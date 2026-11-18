package com.mealdeck.web;

import com.mealdeck.service.MessPredictionService;
import com.mealdeck.service.MessPredictionService.Prediction;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Guesses for today's mess meals nobody has added yet, from past weeks.
 * Public, like the mess menu itself. */
@RestController
public class MessPredictionController {

    private final MessPredictionService predictions;

    public MessPredictionController(MessPredictionService predictions) {
        this.predictions = predictions;
    }

    @GetMapping("/api/mess/predicted")
    public List<Prediction> predicted() {
        return predictions.today();
    }
}
