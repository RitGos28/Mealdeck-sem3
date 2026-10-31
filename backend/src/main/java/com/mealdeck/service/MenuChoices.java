package com.mealdeck.service;

import com.mealdeck.web.ChoiceGroup;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.StringJoiner;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** A dish's free choices, stored as plain text in MenuItem.choices:
 * one group per line, "Name=option1|option2". Validated on the way in, so
 * stored text always parses; and a student's picks are checked against it
 * at checkout, so an order can only ever carry options the stall offers. */
public final class MenuChoices {

    static final int MAX_GROUPS = 4;
    static final int MAX_OPTIONS = 8;
    static final int MAX_NAME = 30;
    static final int MAX_OPTION = 40;

    private MenuChoices() {
    }

    /** Validates and normalises groups; returns the stored text, or null for none. */
    public static String store(List<ChoiceGroup> groups) {
        List<ChoiceGroup> clean = clean(groups);
        if (clean.isEmpty()) return null;
        StringJoiner lines = new StringJoiner("\n");
        for (ChoiceGroup group : clean) lines.add(group.name() + "=" + String.join("|", group.options()));
        return lines.toString();
    }

    public static List<ChoiceGroup> parse(String stored) {
        List<ChoiceGroup> groups = new ArrayList<>();
        if (stored == null || stored.isBlank()) return groups;
        for (String line : stored.split("\n")) {
            int eq = line.indexOf('=');
            if (eq <= 0) continue;
            groups.add(new ChoiceGroup(line.substring(0, eq), List.of(line.substring(eq + 1).split("\\|"))));
        }
        return groups;
    }

    static List<ChoiceGroup> clean(List<ChoiceGroup> groups) {
        List<ChoiceGroup> out = new ArrayList<>();
        if (groups == null) return out;
        if (groups.size() > MAX_GROUPS) throw bad("A dish can have at most " + MAX_GROUPS + " choices");
        LinkedHashSet<String> names = new LinkedHashSet<>();
        for (ChoiceGroup group : groups) {
            String name = text(group == null ? null : group.name(), MAX_NAME, "Choice name");
            if (!names.add(name.toLowerCase())) throw bad("Two choices are both called \"" + name + "\"");
            List<String> raw = group.options() == null ? List.of() : group.options();
            if (raw.size() < 2 || raw.size() > MAX_OPTIONS) throw bad("\"" + name + "\" needs 2 to " + MAX_OPTIONS + " options");
            LinkedHashSet<String> options = new LinkedHashSet<>();
            for (String option : raw) {
                String clean = text(option, MAX_OPTION, "Option");
                if (!options.add(clean)) throw bad("\"" + name + "\" lists \"" + clean + "\" twice");
            }
            out.add(new ChoiceGroup(name, List.copyOf(options)));
        }
        return out;
    }

    /** The order line's choice text ("Bread: Butter Roti ×2 · Style: Gravy"),
     * in the dish's group order; null for a dish with no choices. Every
     * group must be picked, from its own options, and nothing else. */
    public static String describe(String stored, Map<String, String> picked, String dishName) {
        List<ChoiceGroup> groups = parse(stored);
        Map<String, String> picks = picked == null ? Map.of() : picked;
        if (groups.isEmpty()) {
            if (!picks.isEmpty()) throw bad(dishName + " has no choices to make");
            return null;
        }
        for (String key : picks.keySet()) {
            if (groups.stream().noneMatch(group -> group.name().equals(key))) throw bad(dishName + " has no \"" + key + "\" choice");
        }
        StringJoiner text = new StringJoiner(" · ");
        for (ChoiceGroup group : groups) {
            String pick = picks.get(group.name());
            if (pick == null) throw bad("Pick a " + group.name().toLowerCase() + " for " + dishName);
            if (!group.options().contains(pick)) throw bad("\"" + pick + "\" isn't a " + group.name().toLowerCase() + " option for " + dishName);
            text.add(group.name() + ": " + pick);
        }
        return text.toString();
    }

    private static String text(String value, int max, String what) {
        String clean = value == null ? "" : value.strip().replaceAll("\\s+", " ");
        if (clean.isEmpty()) throw bad(what + " can't be empty");
        if (clean.length() > max) throw bad(what + " \"" + clean + "\" is longer than " + max + " characters");
        if (clean.contains("=") || clean.contains("|")) throw bad(what + " \"" + clean + "\" can't contain = or |");
        return clean;
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
