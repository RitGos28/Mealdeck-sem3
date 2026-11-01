package com.mealdeck.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/** One stall's slice of a checkout. A cart spanning stalls becomes one Order
 * per stall (see OrderService), so vendor scoping stays a plain FK check.
 * Table is "orders", not "order": ORDER is a reserved SQL keyword and an
 * unquoted `order` table breaks DDL on both H2 and MySQL. */
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Nullable in the schema only so ddl-auto=update can add the column to
     * a table that already has rows; OrderCodeBackfill fills those in at
     * startup, and every new order gets one in its constructor. */
    @Column(name = "public_code", length = OrderCode.LENGTH, unique = true)
    private String publicCode;

    @ManyToOne
    @JoinColumn(name = "stall_id", nullable = false)
    private Stall stall;

    /** Who placed it. Nullable only for orders from before ordering needed
     * a login; customerName/customerContact are a copy taken at checkout,
     * so the vendor's list doesn't change if the student edits their
     * account later. */
    @ManyToOne
    @JoinColumn(name = "student_id")
    private Student student;

    @Column(nullable = false)
    private String customerName;

    @Column(nullable = false)
    private String customerContact;

    /** One-way code of the student's email (EmailKeys), so the no-show
     * limit still counts this order after the account is deleted. Wiped
     * once the order is older than the no-show window. */
    @Column(length = 64)
    private String customerEmailKey;

    // Plain text, not a MySQL ENUM: ddl-auto=update never edits an ENUM's
    // value list, so a new value would be rejected ("Data truncated").
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 32)
    private OrderStatus status = OrderStatus.PLACED;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    // Nullable only because orders placed before pickup slots existed have
    // none; every new order gets both (see OrderService.checkout).
    private LocalDate pickupDate;

    private LocalTime pickupTime;

    /** When the vendor marked it READY; the no-show countdown starts here. */
    private Instant readyAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    protected Order() {
    }

    public Order(Stall stall, Student student, LocalDate pickupDate, LocalTime pickupTime) {
        this.publicCode = OrderCode.next();
        this.stall = stall;
        this.student = student;
        this.customerName = student.getName();
        // Phone is optional at sign-up; the Bennett email always works.
        this.customerContact = student.getPhone() != null ? student.getPhone() : student.getEmail();
        this.pickupDate = pickupDate;
        this.pickupTime = pickupTime;
    }

    public Long getId() {
        return id;
    }

    public String getPublicCode() {
        return publicCode;
    }

    public String getCustomerEmailKey() { return customerEmailKey; }
    public void setCustomerEmailKey(String customerEmailKey) { this.customerEmailKey = customerEmailKey; }

    public void setPublicCode(String publicCode) {
        this.publicCode = publicCode;
    }

    public Stall getStall() {
        return stall;
    }

    public Student getStudent() {
        return student;
    }

    public String getCustomerName() {
        return customerName;
    }

    public String getCustomerContact() {
        return customerContact;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public LocalDate getPickupDate() {
        return pickupDate;
    }

    public LocalTime getPickupTime() {
        return pickupTime;
    }

    public Instant getReadyAt() {
        return readyAt;
    }

    public void setReadyAt(Instant readyAt) {
        this.readyAt = readyAt;
    }

    public List<OrderItem> getItems() {
        return items;
    }

    public void addItem(OrderItem item) {
        items.add(item);
    }
}
