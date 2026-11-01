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
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    @Column(nullable = false)
    private int quantity;

    /** Snapshot of MenuItem.price at order time, so a later price edit by the
     * vendor doesn't rewrite past orders' totals. */
    @Column(nullable = false)
    private BigDecimal priceAtOrder;

    /** What the student picked, as the stall reads it ("Bread: Butter Roti ×2
     * · Style: Gravy"); null for dishes without choices. A snapshot, like
     * the price, so later menu edits don't rewrite past orders. */
    @Column(length = 300)
    private String choices;

    protected OrderItem() {
    }

    public OrderItem(Order order, MenuItem menuItem, int quantity, BigDecimal priceAtOrder) {
        this(order, menuItem, quantity, priceAtOrder, null);
    }

    public OrderItem(Order order, MenuItem menuItem, int quantity, BigDecimal priceAtOrder, String choices) {
        this.order = order;
        this.menuItem = menuItem;
        this.quantity = quantity;
        this.priceAtOrder = priceAtOrder;
        this.choices = choices;
    }

    public String getChoices() {
        return choices;
    }

    public Long getId() {
        return id;
    }

    public Order getOrder() {
        return order;
    }

    public MenuItem getMenuItem() {
        return menuItem;
    }

    public int getQuantity() {
        return quantity;
    }

    public BigDecimal getPriceAtOrder() {
        return priceAtOrder;
    }
}
