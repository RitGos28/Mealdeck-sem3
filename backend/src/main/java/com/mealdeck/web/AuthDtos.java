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
    public record MeResponse(String role, String email, Long stallId, String name) {
        public MeResponse(String role, String email, Long stallId) {
            this(role, email, stallId, null);
        }
    }

    public record MessageResponse(String message) {
    }

    private AuthDtos() {
    }
}
