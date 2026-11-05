package com.mealdeck.service;

import com.mealdeck.model.SurveyResponse;
import com.mealdeck.repository.SurveyResponseRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

/** The questionnaire in Account. The questions are defined here once and
 * served to the form and the admin view, so changing a question or an option
 * is a code change in one place. Every question is optional, answers can be
 * changed later, and admins see totals and written words without names. */
@Service
public class SurveyService {

    public enum Type { SINGLE, MULTI, TEXT }

    public record Option(String key, String label) {
    }

    /** allowOther: the "other" option also takes a few words of text. */
    public record Question(String id, String title, String hint, Type type, List<Option> options, boolean allowOther) {
    }

    private static Option o(String key, String label) {
        return new Option(key, label);
    }

    public static final List<Question> QUESTIONS = List.of(
            new Question("heard", "Where did you hear about us?", null, Type.SINGLE, List.of(
                    o("friend", "A friend"), o("whatsapp", "A WhatsApp group"), o("poster", "A poster or QR code"),
                    o("social", "Instagram or other social media"), o("hatchery", "Hatchery"),
                    o("forgot", "I don't remember"), o("other", "Somewhere else")), true),
            new Question("stay", "Where do you stay?", null, Type.SINGLE, List.of(
                    o("hostel", "Hostel"), o("day", "Day scholar"), o("other", "Other")), false),
            new Question("often", "How often do you buy food at campus stalls (not the hostel mess)?", null, Type.SINGLE, List.of(
                    o("rarely", "Rarely"), o("one_two", "1 to 2 days a week"), o("three_four", "3 to 4 days a week"),
                    o("most", "Most days"), o("every", "Every day")), false),
            new Question("used", "Which parts of MealDeck have you used?", "Tick all that apply.", Type.MULTI, List.of(
                    o("menus", "Menus and prices"), o("veg", "The veg filter or my diet setting"), o("deal", "Deal me a dish"),
                    o("mess", "Mess today"), o("report", "Reporting a dish out of stock"), o("passport", "The food passport"),
                    o("just", "I've only just opened it")), false),
            new Question("waited", "In the past month, how often did a long wait make you leave a stall or pick something else?", null, Type.SINGLE, List.of(
                    o("never", "Never"), o("once_twice", "Once or twice"), o("several", "Several times"), o("most_weeks", "Most weeks")), false),
            new Question("wouldOrder", "If you could order ahead at a stall and skip the queue, would you use it?", null, Type.SINGLE, List.of(
                    o("definitely", "Definitely"), o("probably", "Probably"), o("unsure", "Not sure"),
                    o("probably_not", "Probably not"), o("definitely_not", "Definitely not")), false),
            new Question("putOff", "What would put you off ordering ahead?", "Tick any.", Type.MULTI, List.of(
                    o("plans", "My plans change last minute"), o("late", "I might be late and the food goes cold"),
                    o("short", "The queue is short anyway"), o("forget", "I'd forget to open the app"),
                    o("ready", "I'm not sure the stall would have it ready"), o("nothing", "Nothing, I'd use it"),
                    o("other", "Something else")), true),
            new Question("change", "What's the one thing you'd change?", "About MealDeck: something missing, confusing or annoying.", Type.TEXT, List.of(), false));

    public static final int MAX_SHORT = 120;
    public static final int MAX_LONG = 600;

    /** For admins: how many chose each option, per question. */
    public record OptionCount(String key, String label, long count) {
    }

    public record QuestionSummary(String id, String title, Type type, List<OptionCount> counts) {
    }

    /** A written answer, with its topic and when, but never who wrote it. */
    public record Comment(String about, String text, Instant at) {
    }

    public record Summary(int responses, List<QuestionSummary> questions, List<Comment> comments) {
    }

    public record Mine(Map<String, Object> answers, Instant answeredAt) {
    }

    private static final TypeReference<Map<String, Object>> ANSWER_MAP = new TypeReference<>() {
    };

    private final SurveyResponseRepository repository;
    private final ObjectMapper json;
    private final Clock clock;

    public SurveyService(SurveyResponseRepository repository, ObjectMapper json, Clock clock) {
        this.repository = repository;
        this.json = json;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public Mine mine(Long studentId) {
        return repository.findByStudentId(studentId).map(row -> new Mine(parse(row), row.getUpdatedAt())).orElse(null);
    }

    /** Checks every answer against the questions, then saves (replacing any earlier answers). */
    @Transactional
    public Mine save(Long studentId, Map<String, Object> raw) {
        Set<String> known = new LinkedHashSet<>();
        for (Question q : QUESTIONS) {
            known.add(q.id());
            if (q.allowOther()) known.add(q.id() + "Other");
        }
        for (String key : raw.keySet()) {
            if (!known.contains(key)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown question: " + key);
        }
        Map<String, Object> clean = new LinkedHashMap<>();
        for (Question q : QUESTIONS) {
            Object value = raw.get(q.id());
            switch (q.type()) {
                case SINGLE -> {
                    String choice = blankToNull(value);
                    if (choice == null) break;
                    requireOption(q, choice);
                    clean.put(q.id(), choice);
                    if (q.allowOther() && choice.equals("other")) putText(clean, q.id() + "Other", raw.get(q.id() + "Other"), MAX_SHORT, q.title());
                }
                case MULTI -> {
                    if (value == null) break;
                    if (!(value instanceof Collection<?> picks)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pick from the list: " + q.id());
                    List<String> keys = new ArrayList<>();
                    for (Object pick : picks) {
                        String key = blankToNull(pick);
                        if (key == null || keys.contains(key)) continue;
                        requireOption(q, key);
                        keys.add(key);
                    }
                    if (keys.isEmpty()) break;
                    clean.put(q.id(), keys);
                    if (q.allowOther() && keys.contains("other")) putText(clean, q.id() + "Other", raw.get(q.id() + "Other"), MAX_SHORT, q.title());
                }
                case TEXT -> putText(clean, q.id(), value, MAX_LONG, q.title());
            }
        }
        SurveyResponse row = repository.findByStudentId(studentId).orElseGet(() -> new SurveyResponse(studentId));
        row.answer(json.writeValueAsString(clean), clock.instant());
        repository.save(row);
        return new Mine(clean, row.getUpdatedAt());
    }

    @Transactional(readOnly = true)
    public Summary summary() {
        List<SurveyResponse> all = repository.findAllByOrderByUpdatedAtDesc();
        Map<String, Map<String, Long>> counts = new LinkedHashMap<>();
        for (Question q : QUESTIONS) {
            Map<String, Long> perOption = new LinkedHashMap<>();
            q.options().forEach(option -> perOption.put(option.key(), 0L));
            counts.put(q.id(), perOption);
        }
        List<Comment> comments = new ArrayList<>();
        for (SurveyResponse row : all) {
            Map<String, Object> answers = parse(row);
            for (Question q : QUESTIONS) {
                Object value = answers.get(q.id());
                if (value == null) continue;
                if (q.type() == Type.TEXT) {
                    comments.add(new Comment(q.title(), String.valueOf(value), row.getUpdatedAt()));
                    continue;
                }
                List<?> picks = value instanceof Collection<?> c ? new ArrayList<>(c) : List.of(value);
                picks.forEach(pick -> counts.get(q.id()).merge(String.valueOf(pick), 1L, Long::sum));
                Object other = answers.get(q.id() + "Other");
                if (other != null) comments.add(new Comment(q.title() + " (other)", String.valueOf(other), row.getUpdatedAt()));
            }
        }
        List<QuestionSummary> questions = new ArrayList<>();
        for (Question q : QUESTIONS) {
            if (q.type() == Type.TEXT) continue;
            List<OptionCount> optionCounts = q.options().stream()
                    .map(option -> new OptionCount(option.key(), option.label(), counts.get(q.id()).get(option.key()))).toList();
            questions.add(new QuestionSummary(q.id(), q.title(), q.type(), optionCounts));
        }
        return new Summary(all.size(), questions, comments);
    }

    private Map<String, Object> parse(SurveyResponse row) {
        try {
            return json.readValue(row.getAnswers(), ANSWER_MAP);
        } catch (JacksonException e) {
            return Map.of();
        }
    }

    private static void requireOption(Question q, String key) {
        if (q.options().stream().noneMatch(option -> option.key().equals(key))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not an option for \"" + q.title() + "\": " + key);
        }
    }

    private static void putText(Map<String, Object> clean, String key, Object value, int max, String what) {
        String text = blankToNull(value);
        if (text == null) return;
        if (text.length() > max) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "\"" + what + "\" can be at most " + max + " characters");
        clean.put(key, text);
    }

    private static String blankToNull(Object value) {
        if (value == null) return null;
        String text = String.valueOf(value).trim();
        return text.isEmpty() ? null : text;
    }
}
