package com.mealdeck.web;

import com.mealdeck.model.Vendor;

/** Safe admin view: deliberately omits the password hash. */
public record VendorAccountDto(Long id, String email, String realEmail, Long stallId, String stallName) {
    public static VendorAccountDto from(Vendor vendor) {
        return new VendorAccountDto(vendor.getId(), vendor.getEmail(), vendor.getRealEmail(), vendor.getStall().getId(), vendor.getStall().getName());
    }
}
