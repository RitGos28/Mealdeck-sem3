package com.mealdeck.web;

import com.mealdeck.service.PageViewService;
import com.mealdeck.service.PageViewService.Summary;
import java.util.regex.Pattern;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

/** POST /api/views: the app reports a page it opened (anyone; counted as a
 * plain daily total). GET /api/admin/views: the totals (admins only, by
 * SecurityConfig's /api/admin/** rule). */
@RestController
public class PageViewController {

    /** Crawlers, link previews and scripts aren't visitors. */
    private static final Pattern NOT_A_PERSON = Pattern.compile("(?i)bot|crawl|spider|slurp|preview|curl|wget|python|httpclient|headless");

    private final PageViewService pageViews;

    public PageViewController(PageViewService pageViews) {
        this.pageViews = pageViews;
    }

    public record ViewRequest(String path, String source) {
    }

    @PostMapping("/api/views")
    public ResponseEntity<Void> view(@RequestBody ViewRequest request,
            @RequestHeader(value = "User-Agent", required = false) String userAgent) {
        if (userAgent != null && !userAgent.isBlank() && !NOT_A_PERSON.matcher(userAgent).find()) {
            pageViews.record(request.path(), request.source());
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/admin/views")
    public Summary views() {
        return pageViews.summary();
    }
}
