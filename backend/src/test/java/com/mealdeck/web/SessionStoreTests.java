package com.mealdeck.web;

import static org.assertj.core.api.Assertions.assertThat;

import com.mealdeck.FixedClockConfig;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

/** Logins live in the SPRING_SESSION table, not in the server's memory, so
 * a restart keeps them. Over real HTTP on a random port, since MockMvc
 * skips the session filter. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("demo")
@Import(FixedClockConfig.class)
class SessionStoreTests {

    @LocalServerPort
    int port;

    @Autowired
    JdbcTemplate jdbc;

    private final HttpClient http = HttpClient.newHttpClient();

    @AfterEach
    void cleanUp() {
        jdbc.update("delete from SPRING_SESSION");
    }

    private HttpResponse<String> send(HttpRequest.Builder request) throws Exception {
        return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    private URI url(String path) {
        return URI.create("http://localhost:" + port + path);
    }

    @Test
    void loginIsStoredInTheDatabaseAndKeepsWorking() throws Exception {
        HttpResponse<String> login = send(HttpRequest.newBuilder(url("/api/auth/student/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("{\"email\":\"student@bennett.edu.in\",\"password\":\"student123\"}")));
        assertThat(login.statusCode()).isEqualTo(200);
        String cookie = login.headers().firstValue("Set-Cookie").orElseThrow().split(";", 2)[0];
        assertThat(cookie).startsWith("SESSION=");

        assertThat(jdbc.queryForObject("select count(*) from SPRING_SESSION where PRINCIPAL_NAME = ?", Integer.class,
                "student@bennett.edu.in")).isEqualTo(1);

        HttpResponse<String> me = send(HttpRequest.newBuilder(url("/api/auth/me")).header("Cookie", cookie));
        assertThat(me.body()).contains("\"role\":\"STUDENT\"");

        // Logging out removes the stored login, not just the cookie.
        send(HttpRequest.newBuilder(url("/api/auth/logout")).header("Cookie", cookie).POST(HttpRequest.BodyPublishers.noBody()));
        assertThat(jdbc.queryForObject("select count(*) from SPRING_SESSION", Integer.class)).isZero();
        assertThat(send(HttpRequest.newBuilder(url("/api/auth/me")).header("Cookie", cookie)).body()).contains("\"role\":null");
    }
}
