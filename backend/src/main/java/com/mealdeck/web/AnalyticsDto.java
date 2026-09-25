package com.mealdeck.web;

import java.math.BigDecimal;
import java.util.List;

public record AnalyticsDto(List<StallStats> stalls, List<ReportedItem> topReportedItems) {

    public record StallStats(Long stallId, String stallName, int totalOrders, BigDecimal revenue, int itemsOutOfStock) {
    }

    public record ReportedItem(String stallName, String itemName, int reportCount) {
    }
}
