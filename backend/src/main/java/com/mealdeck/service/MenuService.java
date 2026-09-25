package com.mealdeck.service;

import com.mealdeck.model.MenuItem;
import com.mealdeck.model.Report;
import com.mealdeck.model.Stall;
import com.mealdeck.model.Student;
import com.mealdeck.repository.MenuItemRepository;
import com.mealdeck.repository.ReportRepository;
import com.mealdeck.repository.StallRepository;
import com.mealdeck.repository.StudentRepository;
import com.mealdeck.web.MenuItemRequests.CreateMenuItemRequest;
import com.mealdeck.web.MenuItemRequests.UpdateMenuItemRequest;
import com.mealdeck.web.MenuItemRequests.UpdateStallRequest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MenuService {

    /** Same threshold mealdeck_improved uses: 3 independent reports hides an item. */
    private static final int REPORT_THRESHOLD = 3;

    /** A student can vote on the same item again after this long, so a
     * genuinely still-out-of-stock item can keep collecting fresh votes
     * even if the vendor never touches it. */
    private static final int REPORT_COOLDOWN_HOURS = 4;

    private final StallRepository stallRepository;
    private final MenuItemRepository menuItemRepository;
    private final ReportRepository reportRepository;
    private final StudentRepository studentRepository;

    public MenuService(
            StallRepository stallRepository,
            MenuItemRepository menuItemRepository,
            ReportRepository reportRepository,
            StudentRepository studentRepository) {
        this.stallRepository = stallRepository;
        this.menuItemRepository = menuItemRepository;
        this.reportRepository = reportRepository;
        this.studentRepository = studentRepository;
    }

    public List<Stall> listStalls() {
        return stallRepository.findAllWithMenuItems();
    }

    /** One vote per student per item per cooldown window. Three votes within
     * that window hides the item. */
    @Transactional
    public void reportOutOfStock(Long menuItemId, Long studentId) {
        MenuItem item = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No menu item " + menuItemId));
        Instant cutoff = Instant.now().minus(REPORT_COOLDOWN_HOURS, ChronoUnit.HOURS);
        if (reportRepository.existsByMenuItemIdAndStudentIdAndCreatedAtAfter(menuItemId, studentId, cutoff)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already reported this item recently");
        }
        Student student = studentRepository.getReferenceById(studentId);

        reportRepository.save(new Report(item, student));
        menuItemRepository.incrementReportCount(menuItemId);

        MenuItem updated = menuItemRepository.findById(menuItemId).orElseThrow();
        if (updated.getReportCount() >= REPORT_THRESHOLD) {
            updated.setAvailable(false);
            menuItemRepository.save(updated);
        }
    }

    /** Every item comes back in stock overnight, votes cleared, so a stale
     * "out of stock" from yesterday doesn't linger into a fresh day. */
    @Transactional
    public void resetDailyAvailability() {
        menuItemRepository.resetAllAvailability();
        reportRepository.deleteAll();
    }

    public Stall getStall(Long stallId) {
        return stallRepository.findById(stallId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No stall " + stallId));
    }

    /** Same fetch-join as findAllWithMenuItems, for callers that need one
     * stall's full item list serialized after the transaction ends. */
    @Transactional(readOnly = true)
    public Stall getStallWithItems(Long stallId) {
        return stallRepository.findByIdWithMenuItems(stallId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No stall " + stallId));
    }

    @Transactional
    public Stall updateStallHours(Long stallId, UpdateStallRequest request) {
        Stall stall = getStall(stallId);
        if (request.openTime() != null) {
            stall.setOpenTime(request.openTime());
        }
        if (request.closeTime() != null) {
            stall.setCloseTime(request.closeTime());
        }
        if (request.closedToday() != null) {
            stall.setClosedToday(request.closedToday());
        }
        stallRepository.save(stall);
        return getStallWithItems(stallId);
    }

    @Transactional
    public MenuItem addItem(Long stallId, CreateMenuItemRequest request) {
        Stall stall = getStall(stallId);
        return menuItemRepository.save(new MenuItem(stall, request.name(), request.price(), request.veg()));
    }

    @Transactional
    public MenuItem updateItem(Long stallId, Long itemId, UpdateMenuItemRequest request) {
        MenuItem item = requireItemOnStall(stallId, itemId);
        if (request.name() != null) {
            item.setName(request.name());
        }
        if (request.price() != null) {
            item.setPrice(request.price());
        }
        if (request.veg() != null) {
            item.setVeg(request.veg());
        }
        if (request.available() != null) {
            item.setAvailable(request.available());
            if (request.available()) {
                item.setReportCount(0);
                // Restocking clears votes so students can report it again
                // if it runs out a second time (three-strike system resets).
                reportRepository.deleteByMenuItemId(item.getId());
            }
        }
        return menuItemRepository.save(item);
    }

    @Transactional
    public void deleteItem(Long stallId, Long itemId) {
        MenuItem item = requireItemOnStall(stallId, itemId);
        menuItemRepository.delete(item);
    }

    /** Every vendor/admin mutation to one item goes through here first, so
     * "can this caller touch this item" is checked in exactly one place. */
    private MenuItem requireItemOnStall(Long stallId, Long itemId) {
        MenuItem item = menuItemRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No menu item " + itemId));
        if (!item.getStall().getId().equals(stallId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "That item belongs to another stall");
        }
        return item;
    }
}
