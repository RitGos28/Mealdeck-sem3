package com.mealdeck.service;

import java.time.Duration;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.BufferingClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/** Calls the local Python model server. Short timeouts, because the
 * estimate is a nice-to-have shown at checkout: if the server is down or
 * slow, the student just doesn't see one. */
@Component
public class HttpEtaModelClient implements EtaModelClient {

    private static final Logger log = LoggerFactory.getLogger(HttpEtaModelClient.class);

    private final RestClient client;

    public HttpEtaModelClient(@Value("${mealdeck.ml.eta.url:http://127.0.0.1:8099}") String url) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(300));
        factory.setReadTimeout(Duration.ofSeconds(1));
        // Buffered, so the request carries a Content-Length: unbuffered
        // factories stream the body chunked, which the Python server's
        // plain http.server handler doesn't read.
        this.client = RestClient.builder()
                .baseUrl(url)
                .requestFactory(new BufferingClientHttpRequestFactory(factory))
                .build();
    }

    @Override
    public Optional<Prediction> predict(Query query) {
        try {
            return Optional.ofNullable(client.post()
                    .uri("/predict")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(query)
                    .retrieve()
                    .body(Prediction.class));
        } catch (RestClientException e) {
            log.debug("ETA model unavailable: {}", e.getMessage());
            return Optional.empty();
        }
    }
}
