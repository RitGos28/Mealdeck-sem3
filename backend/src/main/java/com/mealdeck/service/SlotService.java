package com.mealdeck.service;

import com.mealdeck.model.Stall;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/** Today's pickup times for a stall: every quarter hour on the clock
 * (:00, :15, :30, :45) between opening and closing, the same grid for every
 * stall. Not stored anywhere -- derived from the stall's hours. No
 * per-slot cap; instead an order left uncollected 15 minutes after it's
 * ready becomes a no-show (see OrderService.expireUncollected). */
@Service
public class SlotService {

    /** Stalls with no hours set count as "always open" elsewhere; for slots
     * that would mean 96 slots from midnight, so use normal campus hours. */
    static final LocalTime DEFAULT_OPEN = LocalTime.of(8, 0);
    static final LocalTime DEFAULT_CLOSE = LocalTime.of(22, 0);

    static final int SLOT_MINUTES = 15;

    private final Clock clock;

    public SlotService(Clock clock) {
        this.clock = clock;
    }

    public LocalDate today() {
        return LocalDate.now(clock);
    }

    /** Every pickup time still ahead of us today. */
    public List<LocalTime> upcomingSlots(Stall stall) {
        if (stall.isClosedToday()) {
            return List.of();
        }
        LocalTime now = LocalTime.now(clock);
        return slotTimes(stall).stream().filter(time -> time.isAfter(now)).toList();
    }

    /** Throws unless an order for this stall can be placed for this pickup
     * time right now. */
    public void requireBookable(Stall stall, LocalTime time) {
        if (time == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pick a pickup time for " + stall.getName());
        }
        if (stall.isClosedToday()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, stall.getName() + " is closed today");
        }
        if (!slotTimes(stall).contains(time)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, time + " isn't a pickup slot at " + stall.getName());
        }
        if (!time.isAfter(LocalTime.now(clock))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The " + time + " slot has already started, pick a later one");
        }
    }

    /** Quarter-hour slot starts from the first one at or after opening (a
     * stall opening 8:10 starts at 8:15) up to the last one that still ends
     * by closing time. */
    private List<LocalTime> slotTimes(Stall stall) {
        LocalTime open = stall.getOpenTime() != null ? stall.getOpenTime() : DEFAULT_OPEN;
        LocalTime close = stall.getCloseTime() != null ? stall.getCloseTime() : DEFAULT_CLOSE;
        // Minutes since midnight, rounded up to the quarter hour. Also means a
        // slot near midnight can't wrap LocalTime around to 00:xx and loop.
        int openMinute = (open.toSecondOfDay() + 59) / 60;
        int first = (openMinute + SLOT_MINUTES - 1) / SLOT_MINUTES * SLOT_MINUTES;
        int closeMinute = close.toSecondOfDay() / 60;
        List<LocalTime> times = new ArrayList<>();
        for (int minute = first; minute + SLOT_MINUTES <= closeMinute; minute += SLOT_MINUTES) {
            times.add(LocalTime.ofSecondOfDay(minute * 60L));
        }
        return times;
    }
}
