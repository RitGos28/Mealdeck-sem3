package com.mealdeck.service;

import com.mealdeck.model.MenuItem;
import com.mealdeck.model.Report;
import com.mealdeck.model.Stall;
import com.mealdeck.repository.MenuItemRepository;
import com.mealdeck.repository.ReportRepository;
import com.mealdeck.repository.StallRepository;
import com.mealdeck.web.MenuItemRequests.CreateMenuItemRequest;
import com.mealdeck.web.MenuItemRequests.UpdateMenuItemRequest;
import com.mealdeck.web.MenuItemRequests.UpdateStallRequest;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MenuService {

    /** Same threshold mealdeck_improved uses: 3 independent reports hides an item. */
    private static final int REPORT_THRESHOLD = 3;

    private final StallRepository stallRepository;
    private final MenuItemRepository menuItemRepository;
    private final ReportRepository reportRepository;

    public MenuService(
            StallRepository stallRepository,
            MenuItemRepository menuItemRepository,
            ReportRepository reportRepository) {
        this.stallRepository = stallRepository;
        this.menuItemRepository = menuItemRepository;
        this.reportRepository = reportRepository;
    }

    public List<Stall> listStalls() {
        return stallRepository.findAllWithMenuItems();
    }

    @Transactional
    public void reportOutOfStock(Long menuItemId) {
        MenuItem item = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new IllegalArgumentException("No menu item " + menuItemId));

        reportRepository.save(new Report(item));
        menuItemRepository.incrementReportCount(menuItemId);

        MenuItem updated = menuItemRepository.findById(menuItemId).orElseThrow();
        if (updated.getReportCount() >= REPORT_THRESHOLD) {
            updated.setAvailable(false);
            menuItemRepository.save(updated);
        }
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
