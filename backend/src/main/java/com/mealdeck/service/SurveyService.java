package com.mealdeck.service;

import com.mealdeck.model.SurveyResponse;
import com.mealdeck.repository.SurveyResponseRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** The four questions in Account. Answers are optional and can be changed
 * later; admins see totals and the free text, without who wrote it. */
@Service
public class SurveyService {

    /** Where did you hear about us. */
    public static final Map<String, String> SOURCES = Map.of(
            "friend", "A friend", "whatsapp", "A WhatsApp group", "poster", "A poster or QR code",
            "social", "Instagram or other social media", "hatchery", "Hatchery", "other", "Somewhere else");

    /** What convinced you. */
    public static final Map<String, String> FEATURES = new LinkedHashMap<>();
    static {
        FEATURES.put("menus", "Every stall's menu and prices in one place");
        FEATURES.put("veg", "The veg filter and my diet setting");
        FEATURES.put("deal", "Deal me a dish");
        FEATURES.put("mess", "Mess today");
        FEATURES.put("reports", "Reporting dishes out of stock");
        FEATURES.put("passport", "The food passport");
        FEATURES.put("preorders", "The idea of pre-ordering");
        FEATURES.put("other", "Something else");
    }

    public static final int MAX_SHORT = 120;
    public static final int MAX_LONG = 600;

    public record Request(String source, String sourceOther, List<String> features, String featuresOther, String wishes, String frustrations) {
    }

    public record View(String source, String sourceOther, List<String> features, String featuresOther, String wishes, String frustrations, Instant answeredAt) {
    }

    /** For admins: totals per option, and the free text newest first, with no student. */
    public record Summary(int responses, Map<String, Long> sources, Map<String, Long> features, List<Comment> comments) {
    }

    public record Comment(String about, String text, Instant at) {
    }

    private final SurveyResponseRepository repository;
    private final Clock clock;

    public SurveyService(SurveyResponseRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public View mine(Long studentId) {
        return repository.findByStudentId(studentId).map(SurveyService::view).orElse(null);
    }

    @Transactional
    public View save(Long studentId, Request request) {
        String source = blankToNull(request.source());
        if (source != null && !SOURCES.containsKey(source)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown choice for where you heard about us");
        }
        List<String> features = request.features() == null ? List.of() : request.features().stream().distinct().toList();
        for (String feature : features) {
            if (!FEATURES.containsKey(feature)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown feature: " + feature);
        }
        SurveyResponse row = repository.findByStudentId(studentId).orElseGet(() -> new SurveyResponse(studentId));
        row.answer(source,
                text(request.sourceOther(), MAX_SHORT, "Where you heard about us"),
                features.isEmpty() ? null : String.join(",", features),
                text(request.featuresOther(), MAX_LONG, "Features"),
                text(request.wishes(), MAX_LONG, "Features you want"),
                text(request.frustrations(), MAX_LONG, "Frustrations"),
                clock.instant());
        return view(repository.save(row));
    }

    @Transactional(readOnly = true)
    public Summary summary() {
        List<SurveyResponse> all = repository.findAllByOrderByUpdatedAtDesc();
        Map<String, Long> sources = new LinkedHashMap<>();
        SOURCES.keySet().forEach(key -> sources.put(key, 0L));
        Map<String, Long> features = new LinkedHashMap<>();
        FEATURES.keySet().forEach(key -> features.put(key, 0L));
        List<Comment> comments = new ArrayList<>();
        for (SurveyResponse row : all) {
            if (row.getSource() != null) sources.merge(row.getSource(), 1L, Long::sum);
            if (row.getFeatures() != null) Arrays.stream(row.getFeatures().split(",")).forEach(f -> features.merge(f, 1L, Long::sum));
            addComment(comments, "Heard about us via", row.getSourceOther(), row);
            addComment(comments, "Convinced by", row.getFeaturesOther(), row);
            addComment(comments, "Wants", row.getWishes(), row);
            addComment(comments, "Frustration", row.getFrustrations(), row);
        }
        return new Summary(all.size(), sources, features, comments);
    }

    private static void addComment(List<Comment> comments, String about, String text, SurveyResponse row) {
        if (text != null) comments.add(new Comment(about, text, row.getUpdatedAt()));
    }

    private static View view(SurveyResponse row) {
        return new View(row.getSource(), row.getSourceOther(),
                row.getFeatures() == null ? List.of() : Arrays.asList(row.getFeatures().split(",")),
                row.getFeaturesOther(), row.getWishes(), row.getFrustrations(), row.getUpdatedAt());
    }

    private static String text(String value, int max, String what) {
        String trimmed = blankToNull(value);
        if (trimmed != null && trimmed.length() > max) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, what + " can be at most " + max + " characters");
        }
        return trimmed;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
