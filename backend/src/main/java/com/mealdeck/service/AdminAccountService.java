package com.mealdeck.service;

import com.mealdeck.model.MenuItem;
import com.mealdeck.model.Stall;
import com.mealdeck.model.Vendor;
import com.mealdeck.repository.MenuItemRepository;
import com.mealdeck.repository.OrderRepository;
import com.mealdeck.repository.ReportRepository;
import com.mealdeck.repository.StallRepository;
import com.mealdeck.repository.VendorRepository;
import com.mealdeck.web.MenuItemRequests.CreateStallRequest;
import com.mealdeck.web.AdminUserRequests.UpdateVendorRequest;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/** Admin-only: creating a new stall also means creating the vendor login
 * that owns it, so that pairing lives here rather than in MenuService
 * (which only ever touches stalls that already exist). */
@Service
public class AdminAccountService {

    private final StallRepository stallRepository;
    private final VendorRepository vendorRepository;
    private final MenuItemRepository menuItemRepository;
    private final ReportRepository reportRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminAccountService(StallRepository stallRepository, VendorRepository vendorRepository, MenuItemRepository menuItemRepository,
            ReportRepository reportRepository, OrderRepository orderRepository, PasswordEncoder passwordEncoder) {
        this.stallRepository = stallRepository;
        this.vendorRepository = vendorRepository;
        this.menuItemRepository = menuItemRepository;
        this.reportRepository = reportRepository;
        this.orderRepository = orderRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /** Removes a stall that was never ordered from (set up by mistake, or a
     * placeholder), with its menu, stock reports and vendor login. A stall
     * with any order history is refused: deleting it would take students'
     * past orders with it, so close it or remove its vendor instead. */
    @Transactional
    public void deleteStall(Long id) {
        Stall stall = stallRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No stall " + id));
        long orders = orderRepository.countByStallId(id);
        if (orders > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, stall.getName() + " has " + orders + " past order"
                    + (orders == 1 ? "" : "s") + ". Mark it closed or remove its vendor login instead of deleting it.");
        }
        for (MenuItem item : menuItemRepository.findByStallId(id)) {
            reportRepository.deleteByMenuItemId(item.getId());
            menuItemRepository.delete(item);
        }
        vendorRepository.findByStallId(id).ifPresent(vendorRepository::delete);
        stallRepository.delete(stall);
    }

    @Transactional
    public Vendor createStallWithVendor(CreateStallRequest request) {
        if (!EmailDomains.isStaffEmail(request.vendorEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Vendor login email must be a " + EmailDomains.STAFF_DOMAIN + " address");
        }
        Stall stall = stallRepository.save(new Stall(request.stallName()));
        Vendor vendor = new Vendor(request.vendorEmail(), passwordEncoder.encode(request.vendorPassword()), request.vendorRealEmail(), stall);
        return vendorRepository.save(vendor);
    }

    public List<Vendor> listVendors() { return vendorRepository.findAll(); }

    @Transactional
    public Vendor updateVendor(Long id, UpdateVendorRequest request) {
        Vendor vendor = vendorRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No vendor " + id));
        if (request.email() != null) {
            if (!EmailDomains.isStaffEmail(request.email())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vendor login email must be a " + EmailDomains.STAFF_DOMAIN + " address");
            vendorRepository.findByEmail(request.email().trim().toLowerCase()).filter(other -> !other.getId().equals(id))
                    .ifPresent(other -> { throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with that email already exists"); });
            vendor.setEmail(request.email().trim().toLowerCase());
        }
        if (request.realEmail() != null) vendor.setRealEmail(request.realEmail().isBlank() ? null : request.realEmail().trim());
        if (request.password() != null && !request.password().isBlank()) {
            if (request.password().length() < 6) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 6 characters");
            vendor.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        return vendorRepository.save(vendor);
    }

    @Transactional
    public void deleteVendor(Long id) {
        Vendor vendor = vendorRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No vendor " + id));
        vendorRepository.delete(vendor);
    }
}
