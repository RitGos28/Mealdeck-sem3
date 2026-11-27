package com.mealdeck.web;

/** Small request/response shapes for the auth endpoints, grouped in one file
 * since each is a one-off with no behaviour of its own. */
public class AuthDtos {

    /** Admins send `code` (emailed by /api/auth/admin/login/code) instead
     * of a password; a password only works for admins in the demo profile. */
    public record AdminLoginRequest(String email, String password, String code) {
    }

    public record LoginRequest(String email, String password) {
    }

    /** name: a student's own name, for greeting them; null otherwise. */
    /** vegOnly: a student's "I only eat veg" setting; null for everyone else. */
    /** dealLearning: whether Deal me a dish learns from this student's
     * swipes; null for everyone but students. */
    public record MeResponse(String role, String email, Long stallId, String name, Boolean vegOnly, Boolean dealLearning) {
        public MeResponse(String role, String email, Long stallId) {
            this(role, email, stallId, null, null, null);
        }

        public MeResponse(String role, String email, Long stallId, String name) {
            this(role, email, stallId, name, null, null);
        }

        public MeResponse(String role, String email, Long stallId, String name, Boolean vegOnly) {
            this(role, email, stallId, name, vegOnly, null);
        }
    }

    public record MessageResponse(String message) {
    }

    private AuthDtos() {
    }
}
