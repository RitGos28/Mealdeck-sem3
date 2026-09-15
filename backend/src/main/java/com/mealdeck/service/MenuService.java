package com.mealdeck.service;

import com.mealdeck.model.MenuItem;
import com.mealdeck.model.Report;
import com.mealdeck.model.Stall;
import com.mealdeck.repository.MenuItemRepository;
import com.mealdeck.repository.ReportRepository;
import com.mealdeck.repository.StallRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        item.setReportCount(item.getReportCount() + 1);

        if (item.getReportCount() >= REPORT_THRESHOLD) {
            item.setAvailable(false);
        }

        menuItemRepository.save(item);
    }
}
