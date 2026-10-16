package com.mealdeck.service;

import com.mealdeck.model.Order;
import com.mealdeck.model.OrderStatus;
import com.mealdeck.model.Stall;
import com.mealdeck.repository.OrderRepository;
import com.mealdeck.repository.StallRepository;
import com.mealdeck.web.QueueSnapshot;
import com.mealdeck.web.QueueSnapshot.QueueOrder;
import com.mealdeck.web.SlotDto;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class QueueService {

    private final StallRepository stallRepository;
    private final OrderRepository orderRepository;
    private final SlotService slotService;

    public QueueService(StallRepository stallRepository, OrderRepository orderRepository, SlotService slotService) {
        this.stallRepository = stallRepository;
        this.orderRepository = orderRepository;
        this.slotService = slotService;
    }

    /** Today's remaining pickup slots with how many orders each holds. */
    @Transactional(readOnly = true)
    public List<SlotDto> slots(Long stallId) {
        Stall stall = stallRepository.findById(stallId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No stall " + stallId));
        Map<LocalTime, Long> booked = new HashMap<>();
        for (Object[] row : orderRepository.countActiveBySlot(stallId, slotService.today())) {
            booked.put((LocalTime) row[0], (Long) row[1]);
        }
        int capacity = stall.getSlotCapacity();
        return slotService.upcomingSlots(stall).stream()
                .map(time -> {
                    long count = booked.getOrDefault(time, 0L);
                    return new SlotDto(time, count, capacity, count >= capacity);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public QueueSnapshot snapshot(Long stallId) {
        List<SlotDto> slots = slots(stallId);
        // Already sorted by pickup slot, then time placed: queue order.
        List<Order> today = orderRepository.findByStallIdAndPickupDateWithItems(stallId, slotService.today());
        List<QueueOrder> orders = new ArrayList<>();
        int ahead = 0;
        for (Order order : today) {
            if (order.getStatus().isFinal()) {
                continue;
            }
            orders.add(new QueueOrder(
                    order.getId(),
                    order.getStatus().name(),
                    order.getPickupTime(),
                    order.getStatus() == OrderStatus.READY && order.getReadyAt() != null
                            ? order.getReadyAt().plus(OrderService.NO_SHOW_AFTER)
                            : null,
                    ahead));
            ahead++;
        }
        return new QueueSnapshot(stallId, slots, orders);
    }
}
