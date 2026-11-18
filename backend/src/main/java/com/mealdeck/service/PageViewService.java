package com.mealdeck.service;

import com.mealdeck.model.PageView;
import com.mealdeck.repository.PageViewRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Counts page opens as daily totals per page and source, nothing more:
 * no cookies, no IP addresses, no accounts. Pages are cut to their first
 * part ("/orders/ABC123" counts as "/orders"), so an order code never ends
 * up here; staff pages (/admin, /vendor) and design mockups (/trial) aren't
 * counted. */
@Service
public class PageViewService {

    static final int DAYS = 14;

    private final PageViewRepository views;
    private final Clock clock;

    public PageViewService(PageViewRepository views, Clock clock) {
        this.views = views;
        this.clock = clock;
    }

    /** The page as counted, or null for pages that aren't counted. */
    static String normalize(String path) {
        if (path == null || !path.startsWith("/")) return null;
        String withoutQuery = path.split("[?#]", 2)[0];
        String[] parts = withoutQuery.split("/", 3); // "/orders/X" -> ["", "orders", "X"]
        String first = (parts.length > 1 ? parts[1] : "").toLowerCase(Locale.ROOT);
        if (first.equals("admin") || first.equals("vendor") || first.equals("trial") || first.equals("api")) return null;
        if (!first.matches("[a-z0-9-]{0,30}")) return "/other";
        return "/" + first;
    }

    static String source(String source) {
        return "qr".equals(source) ? "qr" : "direct";
    }

    /** One open of a page. Synchronized: one row per day, page and source,
     * and two first opens of the same page mustn't both insert. */
    @Transactional
    public synchronized void record(String path, String source) {
        String page = normalize(path);
        if (page == null) return;
        LocalDate today = LocalDate.now(clock);
        String from = source(source);
        PageView row = views.findByDateAndPathAndSource(today, page, from)
                .orElseGet(() -> new PageView(today, page, from));
        row.add();
        views.save(row);
    }

    public record Day(LocalDate date, long views, long fromQr) {
    }

    public record Page(String path, long views, long fromQr) {
    }

    /** today / last 7 days / last 14 days, the QR share, one line per day
     * (oldest first, every day present), and the pages by views. */
    public record Summary(long today, long lastWeek, long lastTwoWeeks, long fromQrLastTwoWeeks, List<Day> days, List<Page> pages) {
    }

    @Transactional(readOnly = true)
    public Summary summary() {
        LocalDate today = LocalDate.now(clock);
        LocalDate since = today.minusDays(DAYS - 1);
        Map<LocalDate, long[]> byDay = new TreeMap<>();
        for (int i = 0; i < DAYS; i++) byDay.put(since.plusDays(i), new long[2]);
        Map<String, long[]> byPage = new TreeMap<>();
        for (PageView v : views.findByDateGreaterThanEqual(since)) {
            boolean qr = "qr".equals(v.getSource());
            long[] d = byDay.computeIfAbsent(v.getDate(), k -> new long[2]);
            d[0] += v.getViews();
            if (qr) d[1] += v.getViews();
            long[] p = byPage.computeIfAbsent(v.getPath(), k -> new long[2]);
            p[0] += v.getViews();
            if (qr) p[1] += v.getViews();
        }
        List<Day> days = new ArrayList<>();
        byDay.forEach((date, n) -> days.add(new Day(date, n[0], n[1])));
        List<Page> pages = new ArrayList<>();
        byPage.forEach((path, n) -> pages.add(new Page(path, n[0], n[1])));
        pages.sort((a, b) -> Long.compare(b.views(), a.views()));
        long todayViews = byDay.get(today)[0];
        long week = days.stream().filter(d -> !d.date().isBefore(today.minusDays(6))).mapToLong(Day::views).sum();
        long all = days.stream().mapToLong(Day::views).sum();
        long qr = days.stream().mapToLong(Day::fromQr).sum();
        return new Summary(todayViews, week, all, qr, days, pages);
    }
}
