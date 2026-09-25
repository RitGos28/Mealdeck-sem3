package com.mealdeck.security;

import com.mealdeck.repository.AdminRepository;
import com.mealdeck.repository.StudentRepository;
import com.mealdeck.repository.VendorRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/** Looks an email up as a vendor, then an admin, then a student, and builds
 * a plain Spring Security User with the matching role. Controllers
 * re-look-up the Vendor/Admin/Student row by email when they need more
 * than the role (e.g. which stall) -- keeps this class, and the principal
 * type, trivial. */
@Service
public class AccountUserDetailsService implements UserDetailsService {

    private final VendorRepository vendorRepository;
    private final AdminRepository adminRepository;
    private final StudentRepository studentRepository;

    public AccountUserDetailsService(VendorRepository vendorRepository, AdminRepository adminRepository, StudentRepository studentRepository) {
        this.vendorRepository = vendorRepository;
        this.adminRepository = adminRepository;
        this.studentRepository = studentRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) {
        return vendorRepository.findByEmail(email)
                .map(vendor -> User.withUsername(vendor.getEmail())
                        .password(vendor.getPasswordHash())
                        .authorities("ROLE_VENDOR")
                        .build())
                .or(() -> adminRepository.findByEmail(email)
                        .map(admin -> User.withUsername(admin.getEmail())
                                .password(admin.getPasswordHash())
                                .authorities("ROLE_ADMIN")
                                .build()))
                .or(() -> studentRepository.findByEmail(email)
                        .map(student -> User.withUsername(student.getEmail())
                                .password(student.getPasswordHash())
                                .authorities("ROLE_STUDENT")
                                .build()))
                .orElseThrow(() -> new UsernameNotFoundException("No account for " + email));
    }
}
