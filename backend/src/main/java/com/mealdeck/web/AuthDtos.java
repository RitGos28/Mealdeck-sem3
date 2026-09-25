package com.mealdeck.web;

/** Small request/response shapes for the auth endpoints, grouped in one file
 * since each is a one-off with no behaviour of its own. */
public class AuthDtos {

    public record LoginRequest(String email, String password) {
    }

    public record MeResponse(String role, String email, Long stallId) {
    }

    private AuthDtos() {
    }
}
