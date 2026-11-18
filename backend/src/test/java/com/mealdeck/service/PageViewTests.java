package com.mealdeck.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.mealdeck.FixedClockConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("demo")
@Import(FixedClockConfig.class)
@Transactional
class PageViewTests {

    @Autowired PageViewService pageViews;

    @Test
    void countsPagesAsPlainDailyTotals() {
        pageViews.record("/", "direct");
        pageViews.record("/", "qr");
        pageViews.record("/?stall=3", "qr");
        pageViews.record("/mess", "something-else");
        pageViews.record("/orders/ABC123XYZ456", "direct");
        pageViews.record("/admin", "direct");
        pageViews.record("/vendor/login", "direct");

        PageViewService.Summary summary = pageViews.summary();

        assertThat(summary.today()).isEqualTo(5);
        assertThat(summary.fromQrLastTwoWeeks()).isEqualTo(2);
        assertThat(summary.days()).hasSize(14);
        assertThat(summary.pages()).extracting(PageViewService.Page::path)
                .containsExactly("/", "/mess", "/orders"); // most viewed first; no order code, no staff pages
        assertThat(summary.pages().getFirst().views()).isEqualTo(3);
    }

    @Test
    void cutsPagesToTheirFirstPart() {
        assertThat(PageViewService.normalize("/")).isEqualTo("/");
        assertThat(PageViewService.normalize("/account/deletion")).isEqualTo("/account");
        assertThat(PageViewService.normalize("/Orders/X?y=1")).isEqualTo("/orders");
        assertThat(PageViewService.normalize("/admin/anything")).isNull();
        assertThat(PageViewService.normalize("/api/views")).isNull();
        assertThat(PageViewService.normalize("not-a-path")).isNull();
        assertThat(PageViewService.normalize("/<script>")).isEqualTo("/other");
    }
}
