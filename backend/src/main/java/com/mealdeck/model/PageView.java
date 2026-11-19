package com.mealdeck.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;

/** How many times a page was opened on a day, and from where ("qr" for the
 * showcase QR code, else "direct"). Plain totals: no cookies, no IP
 * addresses, nothing that says who opened it. */
@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"view_date", "path", "source"}))
public class PageView {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "view_date", nullable = false)
    private LocalDate date;

    @Column(nullable = false, length = 40)
    private String path;

    @Column(nullable = false, length = 16)
    private String source;

    @Column(nullable = false)
    private long views;

    protected PageView() {
    }

    public PageView(LocalDate date, String path, String source) {
        this.date = date;
        this.path = path;
        this.source = source;
    }

    public LocalDate getDate() {
        return date;
    }

    public String getPath() {
        return path;
    }

    public String getSource() {
        return source;
    }

    public long getViews() {
        return views;
    }

    public void add() {
        views++;
    }
}
