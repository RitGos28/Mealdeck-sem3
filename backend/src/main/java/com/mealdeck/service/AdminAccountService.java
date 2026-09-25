package com.mealdeck.service;

import com.mealdeck.model.Stall;
import com.mealdeck.model.Vendor;
import com.mealdeck.repository.StallRepository;
import com.mealdeck.repository.VendorRepository;
import com.mealdeck.web.MenuItemRequests.CreateStallRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Admin-only: creating a new stall also means creating the vendor login
 * that owns it, so that pairing lives here rather than in MenuService
 * (which only ever touches stalls that already exist). */
@Service
public class AdminAccountService {

    private final StallRepository stallRepository;
    private final VendorRepository vendorRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminAccountService(StallRepository stallRepository, VendorRepository vendorRepository, PasswordEncoder passwordEncoder) {
        this.stallRepository = stallRepository;
        this.vendorRepository = vendorRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Vendor createStallWithVendor(CreateStallRequest request) {
        Stall stall = stallRepository.save(new Stall(request.stallName()));
        Vendor vendor = new Vendor(request.vendorEmail(), passwordEncoder.encode(request.vendorPassword()), stall);
        return vendorRepository.save(vendor);
    }
}
