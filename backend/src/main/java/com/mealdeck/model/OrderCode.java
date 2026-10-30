package com.mealdeck.model;

import java.security.SecureRandom;

/** The order's public key in links and API calls, e.g. "K7QM2XR9TP4D".
 * Random rather than the sequential id, so one order's link says nothing
 * about any other. No 0/O, 1/I or L, so a code read off a screen can't be
 * misread. 31^12 is about 8 * 10^17, so a clash never happens in practice;
 * the unique column catches it if it ever did. */
public final class OrderCode {

    public static final int LENGTH = 12;
    private static final String ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
    private static final SecureRandom RANDOM = new SecureRandom();

    private OrderCode() {
    }

    public static String next() {
        StringBuilder code = new StringBuilder(LENGTH);
        for (int i = 0; i < LENGTH; i++) {
            code.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return code.toString();
    }

    /** Cheap shape check before touching the database. */
    public static boolean looksValid(String value) {
        return value != null && value.length() == LENGTH && value.chars().allMatch(c -> ALPHABET.indexOf(c) >= 0);
    }
}
