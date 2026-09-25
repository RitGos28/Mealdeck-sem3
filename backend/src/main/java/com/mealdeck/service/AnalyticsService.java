package com.mealdeck.service;

import com.mealdeck.model.Order;
import com.mealdeck.model.OrderStatus;
import com.mealdeck.model.Stall;
import com.mealdeck.repository.OrderRepository;
import com.mealdeck.repository.StallRepository;
import com.mealdeck.web.AnalyticsDto;
import com.mealdeck.web.AnalyticsDto.ReportedItem;
import com.mealdeck.web.AnalyticsDto.StallStats;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

@org.springframework.stereotype.Service
public class AnalyticsService {

    private static final int TOP_REPORTED_LIMIT = 5;

    private final StallRepository stallRepository;
    private final OrderRepository orderRepository;

    public AnalyticsService(StallRepository stallRepository, OrderRepository orderRepository) {
        this.stallRepository = stallRepository;
        this.orderRepository = orderRepository;
    }

    public AnalyticsDto summarize() {
        List<Stall> stalls = stallRepository.findAllWithMenuItems();
        List<Order> orders = orderRepository.findAllWithItems();

        List<StallStats> stallStats = stalls.stream()
                .map(stall -> stallStats(stall, orders))
                .toList();

        List<ReportedItem> topReported = stalls.stream()
                .flatMap(stall -> stall.getMenuItems().stream()
                        .filter(item -> item.getReportCount() > 0)
                        .map(item -> new ReportedItem(stall.getName(), item.getName(), item.getReportCount())))
                .sorted(Comparator.comparingInt(ReportedItem::reportCount).reversed())
                .limit(TOP_REPORTED_LIMIT)
                .toList();

        return new AnalyticsDto(stallStats, topReported);
    }

    private StallStats stallStats(Stall stall, List<Order> allOrders) {
        List<Order> stallOrders = allOrders.stream()
                .filter(order -> order.getStall().getId().equals(stall.getId()))
                .filter(order -> order.getStatus() != OrderStatus.CANCELLED)
                .toList();

        BigDecimal revenue = stallOrders.stream()
                .flatMap(order -> order.getItems().stream())
                .map(item -> item.getPriceAtOrder().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long outOfStock = stall.getMenuItems().stream().filter(item -> !item.isAvailable()).count();

        return new StallStats(stall.getId(), stall.getName(), stallOrders.size(), revenue, (int) outOfStock);
    }
}
