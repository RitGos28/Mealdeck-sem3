package com.mealdeck.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.math.BigDecimal;

@Entity
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "stall_id", nullable = false)
    private Stall stall;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private BigDecimal price;

    private boolean veg = true;

    @Column(nullable = false)
    private boolean available = true;

    @Column(nullable = false)
    private int reportCount = 0;

    protected MenuItem() {
    }

    public MenuItem(Stall stall, String name, BigDecimal price, boolean veg) {
        this.stall = stall;
        this.name = name;
        this.price = price;
        this.veg = veg;
    }

    public Long getId() {
        return id;
    }

    public Stall getStall() {
        return stall;
    }

    public String getName() {
        return name;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public boolean isVeg() {
        return veg;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public int getReportCount() {
        return reportCount;
    }

    public void setReportCount(int reportCount) {
        this.reportCount = reportCount;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public void setVeg(boolean veg) {
        this.veg = veg;
    }
}
